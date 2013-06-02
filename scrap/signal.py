def sighandler(signum, frame):
  log("caught signal")

for i in [x for x in dir(signal) if x.startswith("SIG")]:
  try:
    signum = getattr(signal,i)
    signal.signal(signum, sighandler)
  except:
    log("skipping signal: %s" % i)

