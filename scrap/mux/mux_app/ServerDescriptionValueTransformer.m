#import "ServerDescriptionValueTransformer.h"
#import <Syphon/Syphon.h>

@implementation ServerDescriptionValueTransformer

+ (Class)transformedValueClass       { return [NSString class]; }
+ (BOOL) allowsReverseTransformation { return NO;               }

- (id)transformedValue:(id)value {
	if ([value isKindOfClass:[NSArray class]])
	{
        NSMutableArray *transformed = [NSMutableArray arrayWithCapacity:[value count]];
        for (NSDictionary *description in value) {
            
            // These are the keys we can use in the server description dictionary.
            // Be prepared for either of the keys to be missing.
            
            NSString* name = [description objectForKey:SyphonServerDescriptionNameKey];
            NSString* appName = [description objectForKey:SyphonServerDescriptionAppNameKey];
            
            // A server may not have a name (usually if it is the only server in an application)
            
            NSString *title;
            if ([appName length] > 0)
            {
                if ([name length] > 0)
                {
                    title = [name stringByAppendingFormat:@" - %@", appName, nil];
                }
                else
                {
                    title = appName;
                }
            }
            else if ([name length] > 0)
            {
                title = name;
            }
            else
            {
                title = @"Untitled Server";
            }
            
            [transformed addObject:title];
        }
        return transformed;
	}
	return nil;
}	

@end
