#import "syphon.h"
#import <Syphon/SyphonServer.h>
#import "rmr.h"
#import "win.h"

struct syphon_t::data_t {
  win_t*        window = nullptr;
  SyphonServer* server = nullptr;
};

syphon_t::syphon_t(win_t& window) : __(*new data_t) {
  __.window = &window;

  __.server = [[SyphonServer alloc]
    initWithName: [NSString stringWithUTF8String: window.name().c_str()]
    context:      window.context()
    options:      nil
  ];
}

syphon_t::~syphon_t() {
  [__.server stop];
  [__.server release];
  delete &__;
}

void syphon_t::bind() {
  //NSSize size = NSMakeSize(__.window->width(), __.window->height());
  //auto status = [__.server bindToDrawFrameOfSize: size];
  //if (status != YES) rmr.die("syphon.bind: bindToDrawFrameOfSize failed: %"_fmt((int)status));
}

// render to texture (which i need to do anyways for post-processing effects)
// publish that texture to syphon
// blit the texture to the default draw buffer

// otherwise, i'll have to render to a texture
// bind syphon fbo
// blit texture to syphon fbo
// unbind syphon fbo
// blit texture to default framebuffer

// i'm worried about the errors that i'm getting
// syphon isn't strictly necessary, but it will help

void syphon_t::publish() {
  //[__.server unbindAndPublish];

  [__.server publishFrameTexture: 1
             textureTarget:       GL_TEXTURE_2D
             imageRegion:         NSMakeRect(0, 0, 4096, 4096)
             textureDimensions:   NSMakeSize(4096, 4096)
             flipped:             NO
  ];
}
