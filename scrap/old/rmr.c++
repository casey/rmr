#import "rmr.h"

//template <>
//rmr_t& rmr_t::operator<<(NSString * s) { return rmr << [s UTF8String]; }


u64 rmr_t::id() {
  static u64 next = 0;
  return next++;
}

bool rmr_t::once(sym_t s) {
  static map<sym_t, bool> once_table;

  if (once_table.count(s) > 0) {
    return false;
  }

  once_table[s] = true;
  return true;
}

map<sym_t, bool> once_table;

#import <sys/socket.h>
#import <arpa/inet.h>

void rmr_t::dgram(const char* address, int port, string contents) {
  static int sock = -1;
  rmr.info("sending datagram");

  if (sock == -1) {
    sock = socket(PF_INET, SOCK_DGRAM, 0);
    sock != -1 || rmr.die("dgram: couldn't open socket");
    ti = (1 << 16) - 1; setsockopt(sock, SOL_SOCKET, SO_SNDBUF,    &ti, sizeof(ti));
    ti = 1;             setsockopt(sock, SOL_SOCKET, SO_BROADCAST, &ti, sizeof(ti));
  }

  struct sockaddr_in dest;
  rmr.zero(dest);
  dest.sin_family      = AF_INET;
  dest.sin_port        = htons(port);
  dest.sin_addr.s_addr = inet_addr(address);

  sendto(sock, contents.data(), contents.length(), 0, (struct sockaddr*)&dest, sizeof(dest));
}

#include <fstream>

string rmr_t::slurp(const char *path) {
  std::ifstream in(path, std::ios::in | std::ios::binary);
  if (!in) die(errno); // todo: show error message
  std::string contents;
  in.seekg(0, std::ios::end);
  contents.resize(in.tellg());
  in.seekg(0, std::ios::beg);
  in.read(&contents[0], contents.size());
  in.close();
  return(contents);
}

#include <unordered_map>
using std::unordered_map;

string& rmr_t::fetch(const char *path) {
  static unordered_map<string, string> cache;
  
  if (!cache.count(path)) {
    rmr.hint("fetch: cache miss: "s + path);
    cache[path] = slurp(path);
  }

  return cache[path];
}

double rmr_t::now() {
  auto t = std::chrono::system_clock::now().time_since_epoch();
  return std::chrono::duration_cast<std::chrono::nanoseconds>(t).count() / 1e9;
}

u64 rmr_t::ms() {
  auto t = std::chrono::system_clock::now().time_since_epoch();
  return std::chrono::duration_cast<std::chrono::milliseconds>(t).count();
}

u64 rmr_t::ns() {
  auto t = std::chrono::system_clock::now().time_since_epoch();
  return std::chrono::duration_cast<std::chrono::nanoseconds>(t).count();
}

string run(const char* cmd) {
  FILE* pipe = popen(cmd, "r");
  if (!pipe) return "ERROR";
  char buffer[128];
  std::string result = "";
  while(!feof(pipe)) {
    if(fgets(buffer, 128, pipe) != NULL)
      result += buffer;
  }
  pclose(pipe);
  return result;
}

string rmr_t::git_head() {
  return trim(run("git rev-parse --short HEAD"));
}

#import <execinfo.h>

string rmr_t::trace() {
  vector<string> frames;
  int max_frames = 100;
  void *array[max_frames];
  int trace_size = backtrace(array, max_frames);
  char **strings = backtrace_symbols(array, trace_size);
  for(int i = trace_size - 1; i >= 2; i--)
    frames.push_back(string(strings[i]));
  free(strings);

  string s;
  for(string frame: frames) {
    s += frame;
    s += "\n";
  }
  s.erase(s.length() - 1, 1);

  return s;
}

#import <random>

std::default_random_engine& rng() {
  static std::default_random_engine engine; // todo: change to mt19937_64
  return engine;
}

double rmr_t::random(double min, double max) {
  std::uniform_real_distribution<double> distribution(min, max);
  return distribution(rng());
}

double rmr_t::random() {
  return random(0.0, 1.0);
}

double rmr_t::random(double max) {
  return random(0.0, max);
}

v3 rmr_t::random3(                      ) { return random3(0.0, 1.0); };
v3 rmr_t::random3(double max            ) { return random3(0.0, max); };
v3 rmr_t::random3(double min, double max) { return {random(min, max), random(min, max), random(min, max)}; }

#import <png.h>

rmr_t& rmr_t::write_png(const char* file_name, u8 *pixels, int width, int height) {
  png_structp png_ptr;
  png_infop info_ptr;

  FILE *fp = fopen(file_name, "wb");
  if (!fp) die("[write_png] File %s could not be opened for writing"_fmt % file_name);

  png_ptr = png_create_write_struct(PNG_LIBPNG_VER_STRING, NULL, NULL, NULL);

  if (!png_ptr) die("[write_png] png_create_write_struct failed");

  info_ptr = png_create_info_struct(png_ptr);
  if (!info_ptr) die("[write_png] png_create_info_struct failed");

  if (setjmp(png_jmpbuf(png_ptr))) die("[write_png] Error during init_io");

  png_init_io(png_ptr, fp);

  if (setjmp(png_jmpbuf(png_ptr))) die("[write_png] Error during writing header");

  png_set_IHDR(png_ptr, info_ptr, width, height,
      8, PNG_COLOR_TYPE_RGB_ALPHA, PNG_INTERLACE_NONE,
      PNG_COMPRESSION_TYPE_BASE, PNG_FILTER_TYPE_BASE);

  png_write_info(png_ptr, info_ptr);

  if (setjmp(png_jmpbuf(png_ptr))) die("[write_png] Error during writing bytes");

  png_byte *row_pointers[height];

  for(int i = 0; i < height; i++) {
      row_pointers[height - 1 - i] = pixels + i * width * 4;
  }

  png_write_image(png_ptr, row_pointers);

  /* end write */
  if (setjmp(png_jmpbuf(png_ptr))) die("[write_png] Error during end of write");

  png_write_end(png_ptr, NULL);

  fclose(fp);

  return rmr;
}

char rmr_t::tc = 0;
int  rmr_t::ti = 0;

rmr_t rmr_t::rmr;
rmr_t& rmr = rmr_t::rmr;

#import <OpenGL/gl3.h>

static_assert(CHAR_BIT == 8, "We are totally fucked.");

#define _(a, b) static_assert(std::is_same<a, b>::value, "type " #a " is not " #b)
_(GLboolean , u8 );
_(GLbyte    , i8 ); 
_(GLshort   , i16);
_(GLshort   , short);
_(GLint     , i32);
_(GLint     , int);
_(GLint64   , i64);
_(GLubyte   , u8 );
_(GLushort  , u16);
_(GLushort  , unsigned short);
_(GLuint    , u32);
_(GLuint    , unsigned int);
_(GLuint64  , u64);
_(GLuint64  , unsigned long long int);
_(GLsizei   , i32);
_(GLenum    , u32);
_(GLfloat   , float);
_(GLdouble  , double);
_(png_byte  , u8 );
#undef _
