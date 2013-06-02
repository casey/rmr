  string username      = args.get("--username") ? args.get("--username").str() : "";
  string password      = args.get("--password") ? args.get("--password").str() : "";
  string client_secret = args.get("--client-secret") ? args.get("--client-secret").str() : "";

  if (route == "mux") {
    id = "MUX: %"_fmt(username);
    username     .empty() && rmr.die("no username!");
    password     .empty() && rmr.die("no password!");
    client_secret.empty() && rmr.die("no client secret!");
  }

  static twitch_t* twitch = nullptr;

  SyphonClient* client = nil;

  auto announce = [&](NSDictionary* server) {
    rmr << "announce";
    if (!client) {
      rmr << "creating client";
      client = [[SyphonClient alloc]
        initWithServerDescription: server
                          options: nil
                  newFrameHandler: ^(SyphonClient *client) {
                    //rmr << "new frame"; 
                    CGLContextObj ctx = w.context();
                    SyphonImage* image = [client newFrameImageForContext: ctx];
                    //uploadFrame(image);
                    w.current() || rmr.die("w not current");
                    [image release];
                  }];
    }
  };

  auto update = [&](NSDictionary* server) {
    rmr << "update, whatever";
  };

  auto retire = [&](NSDictionary* server) {
    rmr << "retire";
    if (client) {
      NSString* current_id = [[client serverDescription] objectForKey: SyphonServerDescriptionUUIDKey];
      NSString* retired_id = [server objectForKey: SyphonServerDescriptionUUIDKey];
      rmr << [current_id UTF8String];
      rmr << [retired_id UTF8String];
      if ([retired_id isEqualToString: current_id]) {
        rmr << "current client retired";
        [client release];
        client = nil;
      }
    }
  };

  /*
  [[NSNotificationCenter defaultCenter]
      addObserverForName: SyphonServerAnnounceNotification
                  object: nil
                   queue: [NSOperationQueue mainQueue]
              usingBlock: ^(NSNotification *n) {
                announce([n object]);
              }
  ];

  [[NSNotificationCenter defaultCenter]
      addObserverForName: SyphonServerUpdateNotification
                  object: nil
                   queue: [NSOperationQueue mainQueue]
              usingBlock: ^(NSNotification *n) {
                update([n object]);
              }
  ];

  [[NSNotificationCenter defaultCenter]
      addObserverForName: SyphonServerRetireNotification
                  object: nil
                   queue: [NSOperationQueue mainQueue]
              usingBlock: ^(NSNotification *n) {
                retire([n object]);
              }
  ];
  */

  } else if (route == "mux") { 
    twitch = new twitch_t(username, password, client_secret);
    rmr.atexit([] { delete twitch; });
    static string status = "";

    w.on("tab", [&] {
        rmr << "mux: switching streams";
    });

    w.on_tick([width, height] {
      twitch->poll();
      auto buf = twitch->reserve(width, height);
      for (int i = 0; i < width * height; i++) {
        buf[i * 4 + 0] = 0;
        buf[i * 4 + 1] = 255;
        buf[i * 4 + 2] = 255;
        buf[i * 4 + 3] = 255;
      }
      twitch->submit(buf);

      if (status != twitch->status()) {
        status = twitch->status();
        rmr << status;
      }
    });

  } else if (route == "mux") { 
    twitch = new twitch_t(username, password, client_secret);
    rmr.atexit([] { delete twitch; });
    static string status = "";

    w.on("tab", [&] {
        rmr << "mux: switching streams";
    });

    w.on_tick([width, height] {
      twitch->poll();
      auto buf = twitch->reserve(width, height);
      for (int i = 0; i < width * height; i++) {
        buf[i * 4 + 0] = 0;
        buf[i * 4 + 1] = 255;
        buf[i * 4 + 2] = 255;
        buf[i * 4 + 3] = 255;
      }
      twitch->submit(buf);

      if (status != twitch->status()) {
        status = twitch->status();
        rmr << status;
      }
    });
