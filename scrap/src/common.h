#import <stdio.h>
#import <unistd.h>

#import <queue>
using std::queue;

using std::tuple;

#import <vector>
using std::vector;

#import <array>
using std::array;

#import <iostream>
using std::cout;
using std::cin;
using std::endl;
using std::cerr;
using std::ostream;

#import <string>
using std::string;

#import <unordered_map>
using std::unordered_map;

template<typename Key, typename T>
using map = std::unordered_map<Key, T>;

#import <unordered_set>
using std::unordered_set;

template<typename T>
using set = std::unordered_set<T>;

#import <sstream>
using std::stringstream;

#import <cstdint>

#import <regex>
using std::regex;
using std::regex_token_iterator;
using std::sregex_token_iterator;
using std::smatch;

typedef int8_t       i8;
typedef int16_t      i16;
typedef int32_t      i32;
typedef int64_t      i64;
typedef uint8_t      u8;
typedef uint16_t     u16;
typedef uint32_t     u32;
typedef uint64_t     u64;
typedef unsigned int uint;
typedef intptr_t     iptr;
typedef uintptr_t    uptr;

#import <memory>
using std::unique_ptr;

using std::initializer_list;

struct GLFWwindow;

using namespace std::literals::chrono_literals;
using namespace std::literals::string_literals;

#define EIGEN_MATRIXBASE_PLUGIN "matrix_ext.h"
#define EIGEN_ARRAYBASE_PLUGIN "array.h"

#import <Eigen/Core>
#import <Eigen/Geometry>

typedef Eigen::Affine3f          trans_t;
typedef Eigen::Vector3f          v3;
typedef Eigen::Vector4f          v4;

#define GLFW_INCLUDE_GLCOREARB 1
