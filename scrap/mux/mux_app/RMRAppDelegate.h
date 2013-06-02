#import <Cocoa/Cocoa.h>

#import <Syphon/Syphon.h>
#import "SimpleImageView.h"

@interface RMRAppDelegate : NSObject <NSApplicationDelegate, NSWindowDelegate> {
  SyphonClient*  syClient;
  NSArray*       selectedServerDescriptions;
  NSTimeInterval fpsStart;
  NSUInteger     fpsCount;
  NSUInteger     FPS;
  NSUInteger     frameWidth;
  NSUInteger     frameHeight;
  twitch_t*      twitch;

  NSUInteger frameCount;

  IBOutlet NSTextField*       twitchStatus;
  IBOutlet NSTextField*       stats;
  IBOutlet NSArrayController* availableServersController;
  IBOutlet SimpleImageView*   glView;
}

@property (readwrite, retain) NSArray*   selectedServerDescriptions;
@property (readonly)          NSString*  status;
@property (assign)            NSUInteger FPS;
@property (readwrite, assign) NSUInteger frameWidth;
@property (readwrite, assign) NSUInteger frameHeight;

@end
