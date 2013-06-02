#import "twitch.h"

#import "twitchsdk/twitchsdk.h"

#import <vector>
using std::vector;

#import <iostream>
using std::cerr;
using std::cout;
using std::endl;

#import <string>
using std::string;

double now() {
  auto t = std::chrono::system_clock::now().time_since_epoch();
  return std::chrono::duration_cast<std::chrono::nanoseconds>(t).count() / 1e9;
}

enum class state_t { busy, idle, streaming, dead };

struct twitch_t::data_t {
  typedef void (data_t::*next_f)(void);

  state_t          state             = state_t::busy;
  next_f           next              = nullptr;
  vector<u8*>      current_buffers   = {};
  vector<u8*>      free_buffers      = {};
  vector<u8*>      allocated_buffers = {};
  uint             width             = 0;
  uint             height            = 0;
  NSString*        status            = @"Initializing...";
  double           last_frame        = 0;
  bool             paused            = false;
  TTV_MemCallbacks mem_callbacks;
  TTV_ErrorCode    error_code;
	TTV_AuthParams   auth_params;
	TTV_VideoParams  video_params;
	TTV_AudioParams  audio_params;
  TTV_AuthToken    auth_token;
  TTV_IngestList   ingest_list;
  TTV_IngestServer ingest_server;
  TTV_UserInfo     user_info;
  TTV_StreamInfo   stream_info;
  TTV_ChannelInfo  channel_info;

  bool die(const string& msg) {
    NSLog(@"%@", [NSString stringWithUTF8String: msg.c_str()]);
    state = state_t::dead;
    return true;
  }

  void check(const char* step, TTV_ErrorCode result) {
    TTV_FAILED(result) && die(string(step) + " failed: " + TTV_ErrorToString(result));
  }

  static void callback(TTV_ErrorCode result, void* p) {
    auto instance = (data_t*)p;
    TTV_FAILED(result) && instance->die(string("twitch.callback: failed: ") + TTV_ErrorToString(result));
    auto next = instance->next;
    if (next) {
      instance->next = nullptr;
      (instance->*(next))();
    }
  }

  data_t() {
    mem_callbacks.size          = sizeof(TTV_MemCallbacks);
    mem_callbacks.allocCallback = [](size_t size, size_t alignment) -> void* { return new char[size]; };
    mem_callbacks.freeCallback  = [](void* p) { delete[] (char*)p; };

    check("TTV_Init", TTV_Init(&mem_callbacks, "r26xtdul12py0xh5kuy005eoucgqbob", nullptr));

    TTV_RegisterStatsCallback([](TTV_StatType type, uint64_t value) { cerr << "stats callback" << endl; });
    TTV_SetTraceOutput(L"/tmp/twitch.log");
    TTV_SetTraceLevel(TTV_ML_DEBUG);

    //auth_params.userName = "romrador";
    //auth_params.password = "a8d4e09d92b413b60f65e";

    auth_params.size         = sizeof(TTV_AuthParams);
    //auth_params.userName     = "ixr126H7B1ikhfzWhXfpvivpA";
    //auth_params.password     = "ixrfEHlOqLdbBt0UbRjywzohu";
    auth_params.userName     = "rodarmor";
    auth_params.password     = "gv3fqciqNij6nc";
    auth_params.clientSecret = "hpv7s4ttyuzhrfy2hjhr2hrwdp5zhk";

    audio_params.size                   = sizeof(TTV_AudioParams);
    audio_params.audioEnabled           = true;
    audio_params.enableMicCapture       = false;
    audio_params.enablePlaybackCapture  = true;
    audio_params.enablePassthroughAudio = false;

    user_info.size    = sizeof(TTV_UserInfo);
    stream_info.size  = sizeof(TTV_StreamInfo);
    channel_info.size = sizeof(TTV_ChannelInfo);

    status = @"Requesting authorization token...";

    next = &data_t::auth_done;
    auto x = TTV_RequestAuthToken_Broadcast;
    check("TTV_RequestAuthToken", TTV_RequestAuthToken(&auth_params, x, callback, this, &auth_token));
  }

  ~data_t() {
    TTV_Stop(nullptr, nullptr);
    TTV_Shutdown();
  }

  void auth_done() {
    status = @"Logging in...";
    next = &data_t::login_done;
    check("TTV_Login", TTV_Login(&auth_token, callback, this, &channel_info));
  }

  void login_done() {
    status = @"Getting ingest servers...";
    next = &data_t::ingest_done;
    check("TTV_GetIngestServers", TTV_GetIngestServers(&auth_token, callback, this, &ingest_list));
  }

  void ingest_done() {
    int server = -1;
    for (int i = 0; i < ingest_list.ingestCount; i++) {
      auto& s = ingest_list.ingestList[i];
      string name(s.serverName);
      if (name.find("Stockholm") != string::npos) {
        server = i;
      }

      if (server == -1 && s.defaultServer) {
        server = i;
      }
    }
    
    server == -1 && die("twitch.ingest_done: couldn't find default ingest server");

    ingest_server = ingest_list.ingestList[server];
    
    TTV_FreeIngestList(&ingest_list);

    status = @"Getting user info...";
    next = &data_t::user_info_done;
    check("TTV_GetUserInfo", TTV_GetUserInfo(&auth_token, callback, this, &user_info));
  }

  void user_info_done() {
    status = @"Getting stream info...";
    next = &data_t::stream_info_done;
    check("TTV_GetStreamInfo", TTV_GetStreamInfo(&auth_token, callback, this, auth_params.userName, &stream_info));
  }

  void stream_info_done() {
    status = @"Idle";
    state = state_t::idle;
  }

  void start_done () {
    status = @"Streaming";
    state = state_t::streaming;
  }

  void stop_done() {
    status = @"Idle";
    state = state_t::idle;
  }

  void poll() {
    TTV_PollTasks();

    bool resize_needed = video_params.outputWidth != width || video_params.outputHeight != height;

    if (state == state_t::idle && width != 0 && height != 0) {
      video_params.size                   = sizeof(TTV_VideoParams);
      video_params.outputWidth            = width;
      video_params.outputHeight           = height;
      video_params.pixelFormat            = TTV_PF_RGBA;
      video_params.maxKbps                = 8000;
      video_params.targetFps              = 60;
      video_params.encodingCpuUsage       = TTV_ECU_HIGH;
      video_params.disableAdaptiveBitrate = false;
      video_params.verticalFlip           = true;
      video_params.encoderPlugin          = nullptr;

      state = state_t::busy;
      next = &data_t::start_done;
      status = @"Starting...";
      check("TTV_Start", TTV_Start(&video_params, &audio_params, &ingest_server, 0, callback, this));
    } else if (state == state_t::streaming && resize_needed) {
      state = state_t::busy;
      next = &data_t::stop_done;
      status = @"Stopping...";
      check("TTV_Stop", TTV_Stop(callback, this));
    }
  }

  u8* reserve(uint requested_width, uint requested_height) {
    if (width != requested_width || height != requested_height || current_buffers.size() == 0) {
      width  = requested_width;
      height = requested_height;

      width  % 32 && die("twitch.reserve: bad width requested");
      height % 16 && die("twitch.reserve: bad height requested");

      current_buffers.clear();
      free_buffers.clear();

      for (int i = 0; i < 3; i++) {
        auto b = new u8[width * height * 4]();
        current_buffers  .push_back(b);
        free_buffers     .push_back(b);
        allocated_buffers.push_back(b);
      }
    }

    free_buffers.empty() && die("twitch.reserve: no free buffers");

    auto p = free_buffers.back();
    free_buffers.pop_back();
    return p;
  }

  void submit(u8* buffer) {
    if (state == state_t::streaming) {
      check("TTV_SubmitVideoFrame", TTV_SubmitVideoFrame(buffer, frame_unlock_callback, this));
      last_frame = now();
      paused = false;
      status = @"Streaming";
    } else {
      unlock(buffer);
    }
  }

  void unlock(const u8* buffer) {
    for (auto b : current_buffers) {
      if (b == buffer) {
        free_buffers.push_back(const_cast<u8*>(buffer));
        return;
      }
    }

    for (int i = 0; i < allocated_buffers.size(); i++) {
      if (buffer == allocated_buffers[i]) {
        allocated_buffers.erase(allocated_buffers.begin() + i);
        delete[] buffer;
        return;
      }
    }

    die("twitch.unlock: tried to unlock bad buffer");
  }

  static void frame_unlock_callback(const u8* buffer, void* p) {
    ((data_t*)p)->unlock(buffer);
  }
};

twitch_t::twitch_t() : __(*new data_t) { }
twitch_t::~twitch_t() { delete &__; }

void       twitch_t::poll()                  { __.poll();                        }
bool       twitch_t::dead()                  { return __.state == state_t::dead; }
u8*        twitch_t::reserve(uint w, uint h) { return __.reserve(w, h);          }
void       twitch_t::submit(u8* buffer)      { __.submit(buffer);                }
NSString*  twitch_t::status()                { return __.status;                 }
