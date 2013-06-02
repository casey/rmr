#import <Cocoa/Cocoa.h>

@interface ToolbarDelegate : NSObject <NSToolbarDelegate> {
@private
    IBOutlet NSPopUpButton  *availableServersMenu;
    IBOutlet NSBox *statusBox;
}

@end
