

/*
camera.prototype.projectToCanvas = function(eye, container, opt_coordinate, opt_dest) {
  // todo: this shit totally doesn't work.

  // Convert to a 4 component homogenous vector.
  var v = goog.vec.Vec4.createFloat64();
  if (opt_coordinate) {
    v[0] = opt_coordinate[0];
    v[1] = opt_coordinate[1];
    v[2] = opt_coordinate[2];
  }
  v[3] = 1;

  // Apply the node to node transform.
  var fromTransform = eye.makeFromTransform(container);
  goog.vec.Mat4.multVec4(fromTransform, v, v);

  // Apply the projection, to get clip coordinates.
  goog.vec.Mat4.multVec4(this.projection, v, v);

  // Divide by w, to get normalized device coordinates.
  var w = v[3];
  // I have no idea what to do if w is 0.
  if (w === 0) {
    throw new Error('project: wat. w component is zero');
  }
  goog.vec.Vec4.scale(v, 1 / w, v);

  // Apply the ndcToCanvas transformation.
  goog.vec.Mat4.multVec4(this.ndcToCanvas, v, v);

  // Convert to a 3 component vector and return.
  var dest = opt_dest ? opt_dest : goog.vec.Vec3.createFloat64();
  goog.vec.Vec3.setFromArray(dest, v);
  return dest;
};


camera.prototype.projectFromCanvas = function(eye, container, coordinate, opt_dest) {
  // todo: this shit totally doesn't work.

  var m = this.tempMat4;
  var v = this.tempPosA;
  goog.vec.Vec4.setFromValues(v, coordinate[0], coordinate[1], coordinate[2], 1);

  // Canvas -> NDC
  goog.vec.Mat4.invert(this.ndcToCanvas, m);
  goog.vec.Mat4.multVec4(m, v, v);

  // NDC -> Eye
  goog.vec.Mat4.invert(this.projection, m);
  goog.vec.Mat4.multVec4(m, v, v);

  // Eye -> Model
  var fromTransform = eye.makeFromTransform(container);
  goog.vec.Mat4.invert(fromTransform, m);
  goog.vec.Mat4.multVec4(m, v, v);

  // Perspective division.
  var w = v[3];
  if (w === 0) {
    throw new Error('project: wat. w component is zero');
  }
  goog.vec.Vec4.scale(v, 1 / w, v);

  // Convert to a 3 component vector and return.
  var dest = opt_dest ? opt_dest : goog.vec.Vec3.createFloat64();
  goog.vec.Vec3.setFromArray(dest, v);
  return dest;
};
*/

