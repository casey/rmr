#import "mix.h"

mixin a { };
mixin b { };
mixin c { };

static_assert(sizeof(mix_t<void_t>) == 1,          "mix_t<void_t> unexpectedly large");
static_assert(sizeof(mix_t<void_t, a, b, c>) == 1, "mix_t<void_t, a, b, c> unexpectedly large");
