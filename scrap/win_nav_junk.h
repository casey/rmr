

    /*
    if (e.type.mousedown ) __.cursor_down = true;
    if (e.type.mouseup   ) __.cursor_down = false;

    if (e.type.mousemove) {
      __.cursor_x = e.mousex;
      __.cursor_y = e.mousey;
    }

    if (e.type.mousedown) {
      __.drag_start_x = __.cursor_x;
      __.drag_start_y = __.cursor_y;
    }

    if (e.type.mouseup) {
      __.trackball         = trackball();
      __.trackball_current = m4::identity();
    }

    if (e.type.resize) {
      __.width  = e.width;
      __.height = e.height;
    }

    if (__.cursor_down && e.type.mousemove) {
      float p1x = (__.drag_start_x / __.width ) * 2.0 - 1.0;
      float p1y = (__.drag_start_y / __.height) * 2.0 - 1.0;
      float p2x = (__.cursor_x     / __.width ) * 2.0 - 1.0;
      float p2y = (__.cursor_y     / __.height) * 2.0 - 1.0;
      p1x *= -1.0;
      p2x *= -1.0;
      p1y *= -1.0;
      p2y *= -1.0;
      p1y = p2y = 0.0;

      v2 start = {p1x, p1y};
      v2 end   = {p2x, p2y};
      quat q = quat::trackball(start, end);
      __.trackball_current = q.to_matrix();
    }
    */
