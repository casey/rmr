#import "SimpleImageView.h"
#import <OpenGL/CGLMacro.h>

@interface SimpleImageView ()
@property (readwrite) BOOL needsReshape;
@end

@implementation SimpleImageView

@synthesize needsReshape = _needsReshape, image = _image;

- (void)awakeFromNib {
  const GLint on = 1;
  [[self openGLContext] setValues:&on forParameter:NSOpenGLCPSwapInterval];

  self.needsReshape = YES;
  if ([NSView instancesRespondToSelector:@selector(setWantsBestResolutionOpenGLSurface:)]) {
    // 10.7+
    [self setWantsBestResolutionOpenGLSurface:YES];
  }
}

- (void)dealloc {
    [_image release];
    [super dealloc];
}

- (void)reshape {
    self.needsReshape = YES;
    [super reshape];
}

- (NSSize)renderSize {
    if ([NSView instancesRespondToSelector:@selector(convertRectToBacking:)])
    {
        // 10.7+
        return [self convertSizeToBacking:[self bounds].size];
    }
    else return [self bounds].size;
}

- (void)drawRect:(NSRect)dirtyRect {
  CGLContextObj cgl_ctx = [[self openGLContext] CGLContextObj];

  NSSize frameSize = self.renderSize;

  if (self.needsReshape) {
    // Setup OpenGL states
    glViewport(0, 0, frameSize.width, frameSize.height);

    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    glOrtho(0.0, frameSize.width, 0.0, frameSize.height, -1, 1);

    glMatrixMode(GL_MODELVIEW);
    glLoadIdentity();

    glTranslated(frameSize.width * 0.5, frameSize.height * 0.5, 0.0);

    [[self openGLContext] update];

    self.needsReshape = NO;
  }

  glClearColor(0.0, 0.0, 0.0, 0.0);
  glClear(GL_COLOR_BUFFER_BIT);

  SyphonImage *image = self.image;
  if (image) {
    glEnable(GL_TEXTURE_RECTANGLE_EXT);
    glBindTexture(GL_TEXTURE_RECTANGLE_EXT, image.textureName);

    NSSize textureSize = image.textureSize;

    glColor4f(1.0, 1.0, 1.0, 1.0);

    NSSize scaled;
    float wr = textureSize.width / frameSize.width;
    float hr = textureSize.height / frameSize.height;
    float ratio;
    ratio = (hr < wr ? wr : hr);
    scaled = NSMakeSize((textureSize.width / ratio), (textureSize.height / ratio));

    GLfloat tex_coords[] = {
      0.0,                0.0,
      textureSize.width,  0.0,
      textureSize.width,  textureSize.height,
      0.0,                textureSize.height
    };

    float halfw = scaled.width * 0.5;
    float halfh = scaled.height * 0.5;

    GLfloat verts[] = {
      -halfw, -halfh,
      halfw, -halfh,
      halfw, halfh,
      -halfw, halfh
    };

    glEnableClientState( GL_TEXTURE_COORD_ARRAY );
    glTexCoordPointer(2, GL_FLOAT, 0, tex_coords );
    glEnableClientState(GL_VERTEX_ARRAY);
    glVertexPointer(2, GL_FLOAT, 0, verts );
    glDrawArrays( GL_TRIANGLE_FAN, 0, 4 );
    glDisableClientState( GL_TEXTURE_COORD_ARRAY );
    glDisableClientState(GL_VERTEX_ARRAY);

    glBindTexture(GL_TEXTURE_RECTANGLE_EXT, 0);
    glDisable(GL_TEXTURE_RECTANGLE_EXT);
  }
  [[self openGLContext] flushBuffer];
}

@end
