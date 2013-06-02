#import "RMRAppDelegate.h"

#import "twitch.h"

#import <vector>
using std::vector;

#import <iostream>
using std::cerr;
using std::cout;
using std::endl;

@interface RMRAppDelegate (Private)
- (void)resizeWindowForCurrentVideo;
@end

@implementation RMRAppDelegate

@synthesize FPS;
@synthesize frameWidth;
@synthesize frameHeight;

+ (NSSet *)keyPathsForValuesAffectingStatus {
  return [NSSet setWithObjects:@"frameWidth", @"frameHeight", @"FPS", @"selectedServerDescriptions", nil];
}

- (void)dealloc {
  [selectedServerDescriptions release];
  [super dealloc];
}

- (NSString *)status {
  if (self.frameWidth && self.frameHeight) {
    return [NSString stringWithFormat:@"%lu x %lu : %lu FPS", (unsigned long)self.frameWidth, (unsigned long)self.frameHeight, (unsigned long)self.FPS];
  } else {
    return @"--";
  }
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)theApplication {
	return YES;
}

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification {
  // We use an NSArrayController to populate the menu of available servers
  // Here we bind its content to SyphonServerDirectory's servers array
  [availableServersController bind:@"contentArray" toObject:[SyphonServerDirectory sharedDirectory] withKeyPath:@"servers" options:nil];

  // Slightly weird binding here, if anyone can neatly and non-weirdly improve on this then feel free...
  [self bind:@"selectedServerDescriptions" toObject:availableServersController withKeyPath:@"selectedObjects" options:nil];

  [[glView window] setContentMinSize:(NSSize){400.0,300.0}];
  [[glView window] setDelegate:self];
  
  [[glView window] setRestorable:NO];  
  
  twitch = new twitch_t;
  
  [NSTimer scheduledTimerWithTimeInterval: 1.0 / 60 target:self selector: @selector(loop) userInfo:nil repeats:YES];
}

- (void) loop {
  twitch->poll();
 
  if ([twitchStatus stringValue] != twitch->status()) {
    [twitchStatus setStringValue: twitch->status()];
  }

  [stats setStringValue: [NSString stringWithFormat: @"%lu", frameCount]];

  if (twitch->dead()) {
    [[NSApplication sharedApplication] terminate:nil];
  }
}

- (void) uploadFrame: (SyphonImage*) frame {
  static uint tex    = 0;
  static uint fbo    = 0;
  static uint width  = 0;
  static uint height = 0;

  if (tex == 0) {
    glGenTextures(1, &tex);
    glBindTexture(GL_TEXTURE_2D, tex);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, 32, 32, 0, GL_RGBA, GL_UNSIGNED_BYTE, 0);

    glGenFramebuffers(1, &fbo);
    glBindFramebuffer(GL_FRAMEBUFFER, fbo);
    glFramebufferTextureEXT(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, tex, 0);

    uint draw_buffers = GL_COLOR_ATTACHMENT0;
    glDrawBuffers(1, &draw_buffers);
    if (glCheckFramebufferStatus(GL_FRAMEBUFFER) != GL_FRAMEBUFFER_COMPLETE) {
      cerr << "framebuffer not complete!" << endl;
      exit(1);
    }
  }

  glBindTexture(GL_TEXTURE_2D, tex);
  glBindFramebuffer(GL_FRAMEBUFFER, fbo);

  uint frame_width  = frame.textureSize.width;
  uint frame_height = frame.textureSize.height;

  if (width != frame_width || height != frame_height) {
    width  = frame_width;
    height = frame_height;
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, width, height, 0, GL_RGBA, GL_UNSIGNED_BYTE, 0);
  }

  glMatrixMode(GL_PROJECTION);
  glLoadIdentity();
  glOrtho(0.0, width, 0.0, height, -1, 1);
  glMatrixMode(GL_MODELVIEW);
  glLoadIdentity();
  glTranslated(width * 0.5, height * 0.5, 0.0);

  glViewport(0, 0, width, height);
  glClearColor(1.0, 0.0, 0.0, 0.0);
  glClear(GL_COLOR_BUFFER_BIT);

  glEnable(GL_TEXTURE_RECTANGLE_EXT);
  glBindTexture(GL_TEXTURE_RECTANGLE_EXT, frame.textureName);

  glColor4f(1.0, 1.0, 1.0, 1.0);

  GLfloat tex_coords[] = {
    0.0,          0.0,
    (float)width, 0.0,
    (float)width, (float)height,
    0.0,          (float)height
  };

  float halfw = width  * 0.5;
  float halfh = height * 0.5;

  GLfloat verts[] = {
    -halfw, -halfh,
    halfw, -halfh,
    halfw, halfh,
    -halfw, halfh
  };

  glEnableClientState(GL_TEXTURE_COORD_ARRAY);
  glTexCoordPointer(2, GL_FLOAT, 0, tex_coords);
  glEnableClientState(GL_VERTEX_ARRAY);
  glVertexPointer(2, GL_FLOAT, 0, verts);
  glDrawArrays(GL_TRIANGLE_FAN, 0, 4);
  glDisableClientState(GL_TEXTURE_COORD_ARRAY);
  glDisableClientState(GL_VERTEX_ARRAY);

  auto buffer = twitch->reserve(width, height);
  glGetTexImage(GL_TEXTURE_2D, 0, GL_RGBA, GL_UNSIGNED_BYTE, buffer);
  twitch->submit(buffer);

  glBindTexture(GL_TEXTURE_2D, 0);
  glBindFramebuffer(GL_FRAMEBUFFER, 0);
  glBindTexture(GL_TEXTURE_RECTANGLE_EXT, 0);
  glDisable(GL_TEXTURE_RECTANGLE_EXT);
}

- (NSArray *)selectedServerDescriptions {
    return selectedServerDescriptions;
}

- (void)setSelectedServerDescriptions:(NSArray *)descriptions {
  if (![descriptions isEqualToArray:selectedServerDescriptions]) {
    [descriptions retain];
    [selectedServerDescriptions release];
    selectedServerDescriptions = descriptions;
    // Stop our current client
    [syClient stop];
    [syClient release];
    // Reset our terrible FPS display
    fpsStart = [NSDate timeIntervalSinceReferenceDate];
    fpsCount = 0;
    self.FPS = 0;
    syClient = [[SyphonClient alloc] initWithServerDescription:[descriptions lastObject] options:nil newFrameHandler: ^(SyphonClient *client) {
      // This gets called whenever the client receives a new frame.

      // The new-frame handler could be called from any thread, but because we update our UI we have
      // to do this on the main thread.

      [[NSOperationQueue mainQueue] addOperationWithBlock:^{
        // First we track our framerate...
        fpsCount++;
        frameCount++;
        float elapsed = [NSDate timeIntervalSinceReferenceDate] - fpsStart;
        if (elapsed > 1.0) {
          self.FPS = ceilf(fpsCount / elapsed);
          fpsStart = [NSDate timeIntervalSinceReferenceDate];
          fpsCount = 0;
        }
        // ...then we check to see if our dimensions display or window shape needs to be updated
        SyphonImage *frame = [client newFrameImageForContext: (CGLContextObj)[[glView openGLContext] CGLContextObj]];
        
        [self uploadFrame: frame];
        NSSize imageSize = frame.textureSize;
        
        BOOL changed = NO;
        if (self.frameWidth  != imageSize.width ) { changed = YES; self.frameWidth = imageSize.width;   }
        if (self.frameHeight != imageSize.height) { changed = YES; self.frameHeight = imageSize.height; }
        if (changed) {
          [[glView window] setContentAspectRatio:imageSize];
          [self resizeWindowForCurrentVideo];
        }
        // ...then update the view and mark it as needing display
        glView.image = frame;
        [glView setNeedsDisplay:YES];
        // newFrameImageForContext: returns a retained image, always release it
        [frame release];
      }];
    }];

    // If we have a client we do nothing - wait until it outputs a frame

    // Otherwise clear the view
    if (syClient == nil) {
      glView.image = nil;
      self.frameWidth = 0;
      self.frameHeight = 0;
      [glView setNeedsDisplay:YES];
    }
  }
}

- (void)applicationWillTerminate:(NSNotification *)aNotification {
	[syClient stop];
	[syClient release];
	syClient = nil;
  delete twitch;
  twitch = nullptr;
}

#pragma mark Window Sizing

- (NSSize)windowContentSizeForCurrentVideo {
	NSSize imageSize = NSMakeSize(self.frameWidth, self.frameHeight);
	
	if (imageSize.width == 0 || imageSize.height == 0) {
		imageSize.width = 640;
		imageSize.height = 480;
	}

    return imageSize;
}

- (NSRect)frameRectForContentSize:(NSSize)contentSize {
    // Make sure we are at least as big as the window's minimum content size
	NSSize minContentSize = [[glView window] contentMinSize];
	if (contentSize.height < minContentSize.height) {
		float scale = minContentSize.height / contentSize.height;
		contentSize.height *= scale;
		contentSize.width *= scale;
	}
	if (contentSize.width < minContentSize.width)
	{
		float scale = minContentSize.width / contentSize.width;
		contentSize.height *= scale;
		contentSize.width *= scale;
	}
    
    NSRect contentRect = (NSRect){[[glView window] frame].origin, contentSize};
    NSRect frameRect = [[glView window] frameRectForContentRect:contentRect];
    
    // Move the window up (or down) so it remains rooted at the top left
    float delta = [[glView window] frame].size.height - frameRect.size.height;
    frameRect.origin.y += delta;
    
    // Attempt to remain on-screen
    NSRect available = [[[glView window] screen] visibleFrame];
    if ((frameRect.origin.x + frameRect.size.width) > available.size.width)
    {
        frameRect.origin.x = available.size.width - frameRect.size.width;
    }
    if ((frameRect.origin.y + frameRect.size.height) > available.size.height)
    {
        frameRect.origin.y = available.size.height - frameRect.size.height;
    }

    return frameRect;
}

- (NSRect)windowWillUseStandardFrame:(NSWindow *)window defaultFrame:(NSRect)newFrame {
	// We get this when the user hits the zoom box, if we're not already zoomed
	if ([window isEqual:[glView window]])
	{
		// Resize to the current video dimensions
        return [self frameRectForContentSize:[self windowContentSizeForCurrentVideo]];        
    }
	else
	{
		return newFrame;
	}
}

- (void)resizeWindowForCurrentVideo {
    // Resize to the correct aspect ratio, keeping as close as possible to our current dimensions
    NSSize wantedContentSize = [self windowContentSizeForCurrentVideo];
    NSSize currentSize = [[[glView window] contentView] frame].size;
    float wr = wantedContentSize.width / currentSize.width;
    float hr = wantedContentSize.height / currentSize.height;
    NSUInteger widthScaledToHeight = wantedContentSize.width / hr;
    NSUInteger heightScaledToWidth = wantedContentSize.height / wr;
    if (widthScaledToHeight - currentSize.width < heightScaledToWidth - currentSize.height)
    {
        wantedContentSize.width /= hr;
        wantedContentSize.height /= hr;
    }
    else
    {
        wantedContentSize.width /= wr;
        wantedContentSize.height /= wr;        
    }
    
    NSRect newFrame = [self frameRectForContentSize:wantedContentSize];
    [[glView window] setFrame:newFrame display:YES animate:NO];
}

@end
