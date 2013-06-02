#import "ToolbarDelegate.h"

@implementation ToolbarDelegate

- (NSArray *)toolbarDefaultItemIdentifiers:(NSToolbar *)toolbar
{
    return [NSArray arrayWithObjects:@"ServersMenuItemIdentifier",
            NSToolbarFlexibleSpaceItemIdentifier, @"StatusItemIdentifier",
            NSToolbarFlexibleSpaceItemIdentifier, @"FixedWidthItemIdentifier", nil];
}

- (NSArray *)toolbarAllowedItemIdentifiers:(NSToolbar *)toolbar
{
    return [NSArray arrayWithObjects:@"ServersMenuItemIdentifier", NSToolbarFlexibleSpaceItemIdentifier, @"StatusItemIdentifier", @"FixedWidthItemIdentifier", nil];
}

- (NSToolbarItem *)toolbar:(NSToolbar *)toolbar itemForItemIdentifier:(NSString *)itemIdentifier willBeInsertedIntoToolbar:(BOOL)flag
{
    NSToolbarItem *item = [[[NSToolbarItem alloc] initWithItemIdentifier:itemIdentifier] autorelease];
    if ([itemIdentifier isEqualToString:@"ServersMenuItemIdentifier"])
    {
        [item setLabel:@"Source"];
        [item setPaletteLabel:@"Source"];
        [item setToolTip:@"Select a Syphon Server"];
        [item setView:availableServersMenu];
        [item setMinSize:(NSSize){[availableServersMenu frame].size.width / 3.0, [availableServersMenu frame].size.height}];
        [item setMaxSize:[availableServersMenu frame].size];
        NSMenuItem *menuForm = [[[NSMenuItem alloc] init] autorelease];
        [menuForm setMenu:[availableServersMenu menu]];
        [item setMenuFormRepresentation:menuForm];
    }
    else if ([itemIdentifier isEqualToString:@"StatusItemIdentifier"])
    {
        [item setLabel:@"Status"];
        [item setPaletteLabel:@"Status"];
        [item setToolTip:@"Status"];
        [statusBox setCornerRadius:4.0];
        [item setView:statusBox];
    }
    else if ([itemIdentifier isEqualToString:@"FixedWidthItemIdentifier"])
    {
        // This is an invisible item with the same sizing behaviour as the menu, to keep the status centered
        NSView *empty = [[[NSView alloc] initWithFrame:[availableServersMenu frame]] autorelease];
        [item setView:empty];
        [item setMinSize:(NSSize){[empty frame].size.width / 3.0, [empty frame].size.height}];
        [item setMaxSize:[empty frame].size];
    }
    else
    {
        NSLog(@"Unexpect toolbar item %@", itemIdentifier);
        item = nil;
    }
    return item;
}
@end
