#!/usr/bin/env python3.3

import re

template_decl = '''
struct V {
  CONSTRUCTORS
  ACCESSORS

  T* data();

private:
  T _[N];
};
'''

members = '''
T* data() { return_; }
'''

def parts(s):
  return s.split(" ", 2)

def decl(a):
  return "  %s %s;" % (a[0], a[1])

def impl(a):
  return "%s V::%s %s" % (a[0], a[1], a[2])

print("struct V {")

for member in re.split("\n+", members):
  if member:
    p = parts(member)
    print(decl(p))
print("};")

print()
print()

for member in members.split("\n"):
  if member:
    p = parts(member)
    print(impl(p))
