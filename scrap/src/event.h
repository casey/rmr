struct event_t {
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

    bool move;       // x y
    bool resize;     // w h
    bool close;
    bool refresh;
    bool focus;
    bool blur;
    bool iconify;
    bool restore;

    bool resize_framebuffer; // w h
  } type;

  int key;
  int codepoint;

  double scrollx;
  double scrolly;

  int button;
  double mousex;
  double mousey;

  int windowx;
  int windowy;

  int framebufferx;
  int framebuffery;

  int width;
  int height;

  bool shift;
  bool control;
  bool alt;
  bool super;

  bool printable();
  bool function();

  // printable
  bool key_space();
  bool key_apostrophe();
  bool key_comma();
  bool key_minus();
  bool key_period();
  bool key_slash();
  bool key_0();
  bool key_1();
  bool key_2();
  bool key_3();
  bool key_4();
  bool key_5();
  bool key_6();
  bool key_7();
  bool key_8();
  bool key_9();
  bool key_semicolon();
  bool key_equal();
  bool key_a();
  bool key_b();
  bool key_c();
  bool key_d();
  bool key_e();
  bool key_f();
  bool key_g();
  bool key_h();
  bool key_i();
  bool key_j();
  bool key_k();
  bool key_l();
  bool key_m();
  bool key_n();
  bool key_o();
  bool key_p();
  bool key_q();
  bool key_r();
  bool key_s();
  bool key_t();
  bool key_u();
  bool key_v();
  bool key_w();
  bool key_x();
  bool key_y();
  bool key_z();
  bool key_left_bracket();
  bool key_backslash();
  bool key_right_bracket();
  bool key_grave_accent();
  bool key_world_1();
  bool key_world_2();
  
  // function
  bool key_escape();
  bool key_enter();
  bool key_tab();
  bool key_backspace();
  bool key_insert();
  bool key_delete();
  bool key_right();
  bool key_left();
  bool key_down();
  bool key_up();
  bool key_page_up();
  bool key_page_down();
  bool key_home();
  bool key_end();
  bool key_caps_lock();
  bool key_scroll_lock();
  bool key_num_lock();
  bool key_print_screen();
  bool key_pause();
  bool key_f1();
  bool key_f2();
  bool key_f3();
  bool key_f4();
  bool key_f5();
  bool key_f6();
  bool key_f7();
  bool key_f8();
  bool key_f9();
  bool key_f10();
  bool key_f11();
  bool key_f12();
  bool key_f13();
  bool key_f14();
  bool key_f15();
  bool key_f16();
  bool key_f17();
  bool key_f18();
  bool key_f19();
  bool key_f20();
  bool key_f21();
  bool key_f22();
  bool key_f23();
  bool key_f24();
  bool key_f25();
  bool key_kp_0();
  bool key_kp_1();
  bool key_kp_2();
  bool key_kp_3();
  bool key_kp_4();
  bool key_kp_5();
  bool key_kp_6();
  bool key_kp_7();
  bool key_kp_8();
  bool key_kp_9();
  bool key_kp_decimal();
  bool key_kp_divide();
  bool key_kp_multiply();
  bool key_kp_subtract();
  bool key_kp_add();
  bool key_kp_enter();
  bool key_kp_equal();
  bool key_left_shift();
  bool key_left_control();
  bool key_left_alt();
  bool key_left_super();
  bool key_right_shift();
  bool key_right_control();
  bool key_right_alt();
  bool key_right_super();
  bool key_menu();
  bool key_last();

  bool key_unknown();
};
