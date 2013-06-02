inline
Matrix<Scalar, RowsAtCompileTime + 1, ColsAtCompileTime>
extend(Scalar v) { 
  Matrix<Scalar, RowsAtCompileTime + 1, ColsAtCompileTime> x;
  x << *this, v;
  return x;
}
