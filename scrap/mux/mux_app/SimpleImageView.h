#import <Cocoa/Cocoa.h>
#import <Syphon/Syphon.h>

@interface SimpleImageView : NSOpenGLView {
    SyphonImage *_image;
    BOOL _needsReshape;
}
@property (readwrite, strong) SyphonImage *image;
/*
 Returns the dimensions the GL view will render at, including any adjustment for a high-resolution display
 */
@property (readonly) NSSize renderSize;
@end
