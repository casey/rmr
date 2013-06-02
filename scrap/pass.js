var glod = rmr.glod();

glod.pass('main', function (glod, data) {
});

glod.pass('scene', function (glod, data) {
});

glod.render('main', 'scene');

/*
   what needs to be done?

   * create and manage framebuffers and framebuffer textures
   * determine the framebuffer to use (odd, even, or direct)
   * attach textures to framebuffers
   * call gl viewport and gl scissor
   * determine the pixel size of each pass depending on scaling factors and final output size


   what might need to be done eventually?

   * manage multi input/output dependencies ([specular, reflection, diffuse], composite, aa)


   approaches?

   * glod only provides information:
     - current pass resolution (actually, just scale)
     - name of target ('odd', 'even', 'direct' or true, false, null)
     - name of source (as above)

   * like the above, but it actually provides the fbo for target and source
     - data.source / data.target
   
   * glod allows for the creation of 'targets', which combine framebuffer and framebuffer texture
     - glod.createTarget('odd')
     - glod.createTarget('even')
     - data.source.fbo, data.source.texture
     - data.target.fbo, data.target.texture
   
   * glod actually performs all of the attaching/detaching/viewport/scissor/etc calls itself

   judgement

   the more glod does, the more inflexible the api becomes. webgl is difficult and error prone, but it
   also lets you do whatever you want. if i eventually need to do some wierd ass buffer attachements,
   an api from glod that tries to do a lot might become a pain. the change would no longer be a superficial
   one in the camera, but a deep change going down into glod itself

   also, if i first rig it as an info provider, moving the actual operations from camera into glod will be
   easy. so, let's start with that
*/
