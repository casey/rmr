
  template<typename T>
  struct is_tree_helper {
    static constexpr bool value = 
      // has parent function that returns a reference to the same type
      // has begin and end that 
  };


  template<typename T>
  struct is_tree : std::integral_constant<bool, is_tree_helper<T>::value> {
  };
  
  
  {
    template<class X>
    static 

    // has parent function
    // has begin and end that iterate over children
  };
