#import "syphon.h"
#import <Syphon/SyphonServer.h>
#import "rmr.h"
#import "win.h"
#import "gl.h"
#import "once.h"

struct syphon_t::data_t {
  win_t&        window;
  SyphonServer* server = nullptr;
  bool          bound  = false;
};

syphon_t::syphon_t(win_t& window) : __(*new data_t{window}) {
  auto name = [[NSString alloc] initWithUTF8String: window.name().c_str()];

  __.server = [[SyphonServer alloc]
    initWithName: name
    context:      window.context()
    options:      nil
  ];

  [name release];
}

syphon_t::~syphon_t() {
  [__.server stop];
  [__.server release];
  delete &__;
}

void syphon_t::bind() {
  static once_t first;
  __.bound && rmr.die("syphon.bind: double bind");
  NSSize size = NSMakeSize(__.window.width(), __.window.height());
  auto status = [__.server bindToDrawFrameOfSize: size];
  if (first) __.window.gl().expect_invalid_operation();
  if (status != YES) rmr.die("syphon.bind: bindToDrawFrameOfSize failed: %"_fmt((int)status));
  __.bound = true;
}

void syphon_t::publish() {
  [__.server unbindAndPublish];
  __.bound = false;
}

bool syphon_t::has_clients() {
  return [__.server hasClients];
}
