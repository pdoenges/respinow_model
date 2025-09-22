#include "communication.h"

val data_struct::get_time(){
	double* a= &time[0];
	return val(typed_memory_view(time.size(),a));
};

val data_struct::get_SS(){
	double* a= &SS[0];
	return val(typed_memory_view(SS.size(),a));
};
val data_struct::get_SI(){
	double* a= &SI[0];
	return val(typed_memory_view(SI.size(),a));
};
val data_struct::get_SR(){
	double* a= &SR[0];
	return val(typed_memory_view(SR.size(),a));
};
val data_struct::get_IS(){
	double* a= &IS[0];
	return val(typed_memory_view(IS.size(),a));
};
val data_struct::get_II(){
	double* a= &II[0];
	return val(typed_memory_view(II.size(),a));
};
val data_struct::get_IR(){
	double* a= &IR[0];
	return val(typed_memory_view(IR.size(),a));
};
val data_struct::get_RS(){
	double* a= &RS[0];
	return val(typed_memory_view(RS.size(),a));
};
val data_struct::get_RI(){
	double* a= &RI[0];
	return val(typed_memory_view(RI.size(),a));
};
val data_struct::get_RR(){
	double* a= &RR[0];
	return val(typed_memory_view(RR.size(),a));
};
