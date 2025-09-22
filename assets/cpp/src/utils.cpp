#include "utils.h"


//======================================================================
// Returns interpolated value at x from parallel arrays ( xData, yData )
// Assumes that xData has at least two elements, is sorted and is strictly monotonic increasing
// boolean argument extrapolate determines behaviour beyond ends of array (if needed)
double interpolate( vector<double> &xData, vector<double> &yData, double x, bool extrapolate )
{
   int size = xData.size();

   int i = 0;                                                                  // find left end of interval for interpolation
   if ( x >= xData[size - 2] )                                                 // special case: beyond right end
   {
      i = size - 2;
   }
   else
   {
      while ( x > xData[i+1] ) i++;
   }
   double xL = xData[i], yL = yData[i], xR = xData[i+1], yR = yData[i+1];      // points on either side (unless beyond ends)
   if ( !extrapolate )                                                         // if beyond ends of array and not extrapolating
   {
      if ( x < xL ) yR = yL;
      if ( x > xR ) yL = yR;
   }

   double dydx = ( yR - yL ) / ( xR - xL );                                    // gradient

   return yL + dydx * ( x - xL );                                              // linear interpolation
}



//Function for time modulation
double logistics(double t,
   double center, double length, double change) {
   /*
   Parameterized logistics function see model based and free paper
   */
   return change/(1 + exp(-4.0/length * (t-center)));
};


double gaussian_peak(double t,
   double mean, double variance, double change) {
   /*
   Parameterized peak function to have a height called change
   */
   return change * exp(-(t-mean)*(t-mean)/(2*variance*variance));
}

vector<double> convolve(const vector<double>& a, const vector<double>& b)
{
    int n_a = a.size();
    int n_b = b.size();
    vector<double> result(n_a + n_b - 1);

    for (int i = 0; i < n_a + n_b - 1; ++i) {
        double sum = 0.0;
        for (int j = 0; j <= i; ++j) {
            sum += ((j < n_a) && (i-j < n_b)) ? a[j]*b[i-j] : 0.0;
        }
        result[i] = sum;
    }
    return result;
}
double gamma_pdf(double x,double a, double b){
   return pow(x,a-1.0)*exp(-x)/tgamma(a);
}



