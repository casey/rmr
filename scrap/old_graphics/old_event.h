struct old_event_t {
  struct {
    bool keydown;    // key
    bool keyup;      // key
    bool keyrepeat;  // key
    bool character;  // codepoint

    bool mousedown;  // button
    bool mouseup;    // button
    bool mousemove;  // x y
    bool mouseenter;
    bool mouseleave;

    bool scroll;     // x y

    bool resize;     // w h
    bool close;
    bool refresh;
    bool focus;
    bool blur;
    bool iconify;
    bool restore;

    bool resize_framebuffer; // w h

    bool tick;
  } type;

  int key;
  int codepoint;

  double scrollx;
  double scrolly;

  int button;
  double mousex;
  double mousey;

  int framebufferx;
  int framebuffery;

  int width;
  int height;

  bool shift;
  bool control;
  bool alt;
  bool super;

  bool printable() const;
  bool function() const;

  // printable
  bool key_space() const;
  bool key_apostrophe() const;
  bool key_comma() const;
  bool key_minus() const;
  bool key_period() const;
  bool key_slash() const;
  bool key_0() const;
  bool key_1() const;
  bool key_2() const;
  bool key_3() const;
  bool key_4() const;
  bool key_5() const;
  bool key_6() const;
  bool key_7() const;
  bool key_8() const;
  bool key_9() const;
  bool key_semicolon() const;
  bool key_equal() const;
  bool key_a() const;
  bool key_b() const;
  bool key_c() const;
  bool key_d() const;
  bool key_e() const;
  bool key_f() const;
  bool key_g() const;
  bool key_h() const;
  bool key_i() const;
  bool key_j() const;
  bool key_k() const;
  bool key_l() const;
  bool key_m() const;
  bool key_n() const;
  bool key_o() const;
  bool key_p() const;
  bool key_q() const;
  bool key_r() const;
  bool key_s() const;
  bool key_t() const;
  bool key_u() const;
  bool key_v() const;
  bool key_w() const;
  bool key_x() const;
  bool key_y() const;
  bool key_z() const;
  bool key_left_bracket() const;
  bool key_backslash() const;
  bool key_right_bracket() const;
  bool key_grave_accent() const;
  bool key_world_1() const;
  bool key_world_2() const;
  
  // function
  bool key_escape() const;
  bool key_enter() const;
  bool key_tab() const;
  bool key_backspace() const;
  bool key_insert() const;
  bool key_delete() const;
  bool key_right() const;
  bool key_left() const;
  bool key_down() const;
  bool key_up() const;
  bool key_page_up() const;
  bool key_page_down() const;
  bool key_home() const;
  bool key_end() const;
  bool key_caps_lock() const;
  bool key_scroll_lock() const;
  bool key_num_lock() const;
  bool key_print_screen() const;
  bool key_pause() const;
  bool key_f1() const;
  bool key_f2() const;
  bool key_f3() const;
  bool key_f4() const;
  bool key_f5() const;
  bool key_f6() const;
  bool key_f7() const;
  bool key_f8() const;
  bool key_f9() const;
  bool key_f10() const;
  bool key_f11() const;
  bool key_f12() const;
  bool key_f13() const;
  bool key_f14() const;
  bool key_f15() const;
  bool key_f16() const;
  bool key_f17() const;
  bool key_f18() const;
  bool key_f19() const;
  bool key_f20() const;
  bool key_f21() const;
  bool key_f22() const;
  bool key_f23() const;
  bool key_f24() const;
  bool key_f25() const;
  bool key_kp_0() const;
  bool key_kp_1() const;
  bool key_kp_2() const;
  bool key_kp_3() const;
  bool key_kp_4() const;
  bool key_kp_5() const;
  bool key_kp_6() const;
  bool key_kp_7() const;
  bool key_kp_8() const;
  bool key_kp_9() const;
  bool key_kp_decimal() const;
  bool key_kp_divide() const;
  bool key_kp_multiply() const;
  bool key_kp_subtract() const;
  bool key_kp_add() const;
  bool key_kp_enter() const;
  bool key_kp_equal() const;
  bool key_left_shift() const;
  bool key_left_control() const;
  bool key_left_alt() const;
  bool key_left_super() const;
  bool key_right_shift() const;
  bool key_right_control() const;
  bool key_right_alt() const;
  bool key_right_super() const;
  bool key_menu() const;
  bool key_last() const;

  bool key_unknown() const;
};
