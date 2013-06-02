_ gl_t::value(sym_t s, texture_unit_t u) {
  auto& var = __.get_var(s);
  var.check(1, GL_SAMPLER_2D);
  if (var.attrib) rmr.die("gl.value: int attributes are not supported");
  else            glUniform1i(var.location, u.name);
  var.ready = true;
  return *this;
}
