  .createTexture('sprite'              )
  var spriteSource = node.getSpriteSource();
  if (spriteSource) {
    var width = spriteSource.width;
    var height = spriteSource.height;
    var powerOfTwo = (width & (width - 1)) === 0;
    // Upload the sprite if it's ready, square, and the sides are a power of
    // two. Otherwise upload a placeholder.
    if (width === 0 || height === 0 || width !== height || !powerOfTwo) {
      glod.uploadPlaceholder('sprite');
    } else {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.bindTexture(gl.TEXTURE_2D, glod.texture('sprite'));
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, spriteSource);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    }

    glod.uniform('drawSprite', 1);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, glod.texture('sprite'));

    gl.bindBuffer(gl.ARRAY_BUFFER, glod.vbo('quad'));
    glod.attribPointer('vertex');

    glod.attrib('color', 0, 0, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
