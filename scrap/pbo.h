/*
uint pbo;
glGenBuffers(1, &pbo);
glBindBuffer(GL_PIXEL_PACK_BUFFER, pbo_id);
glBufferData(GL_PIXEL_PACK_BUFFER, 32 * 32 * 4, 0, GL_DYNAMIC_READ);
glBindBuffer(GL_PIXEL_PACK_BUFFER, 0);

glReadBuffer(GL_COLOR_ATTACHMENT0);
glBindBuffer(GL_PIXEL_PACK_BUFFER, pbo_id);
glReadPixels(0, 0, width, height, GL_RGBA, GL_UNSIGNED_BYTE, 0);
GLubyte *ptr = glMapBufferRange(GL_PIXEL_PACK_BUFFER, 0, pbo_size, GL_MAP_READ_BIT);
memcpy(pixels, ptr, pbo_size);
glUnmapBuffer(GL_PIXEL_PACK_BUFFER);
glBindBuffer(GL_PIXEL_PACK_BUFFER, 0);
*/
