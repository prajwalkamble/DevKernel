cmake_minimum_required(VERSION 3.21)

project(shapes
    VERSION      1.2.0
    DESCRIPTION  "A small geometry library and a demo"
    LANGUAGES    CXX)

set(CMAKE_CXX_STANDARD          20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS        OFF)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)

add_library(shapes
    src/circle.cpp
    src/rectangle.cpp)

target_include_directories(shapes
    PUBLIC  $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
            $<INSTALL_INTERFACE:include>
    PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/src)

target_compile_features(shapes PUBLIC cxx_std_20)

target_compile_options(shapes PRIVATE
    $<$<CXX_COMPILER_ID:GNU,Clang>:-Wall -Wextra -Wpedantic>
    $<$<CXX_COMPILER_ID:MSVC>:/W4>)

add_library(shapes::shapes ALIAS shapes)

add_executable(demo src/main.cpp)
target_link_libraries(demo PRIVATE shapes::shapes)
