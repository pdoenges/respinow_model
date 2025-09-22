#include "model.h"
#include <cmath>
#include "utils.h"

Model::Model(){
	//std::cout << "Model constructor" << std::endl;
}

Model::~Model() {
	//std::cout << "Model deconstructor" << std::endl;
	clear();
}

void Model::clear(){
	time.clear();
}

void Model::set_initials(
	double _SS,
	double _SI,
	double _SR,
	double _IS,
	double _II,
	double _IR,
	double _RS,
	double _RI,
	double _RR
){
	SV initials = {_SS,_SI,_SR,_IS,_II,_IR,_RS,_RI,_RR};
	set_initials(initials);
}

void Model::set_initials(SV initials){
	clear();
	time.push_back(0.0);

	init = initials;
}

void Model::set_k(TimeDependentParameter _k){
	k = _k;
};
void Model::set_Phi_1(TimeDependentParameter p){
	Phi_1 = p;
};
void Model::set_Phi_2(TimeDependentParameter p){
	Phi_2 = p;
};
TimeDependentParameter Model::get_k(){
	return k;
};
TimeDependentParameter Model::get_Phi_1(){
	return Phi_1;
};
TimeDependentParameter Model::get_Phi_2(){
	return Phi_2;
};

#define SS current[0]
#define SI current[1]
#define SR current[2]
#define IS current[3]
#define II current[4]
#define IR current[5]
#define RS current[6]
#define RI current[7]
#define RR current[8]

SV Model::dgl(double t, SV current){
	/*
	Model equations.
	State vector entries are defined for readability.
	*/


	SV next;

	//SS compartment
	next[0] =
		omega_1*RS -  F_1(current, t)*SS  +
		omega_2*SR -  F_2(current, t)*SS;

	//SI compartment
	next[1] =
		omega_1*RI - Fs_1(current, t)*SI  +
		 F_2(current, t)*SS - gamma_2*SI;

	//SR compartment
	next[2] =
		omega_1*RR - Fs_1(current, t)*SR  +
		gamma_2*SI - omega_2*SR;

	//IS compartment
	next[3] =
		 F_1(current, t)*SS - gamma_1*IS  +
		omega_2*IR - Fs_2(current, t)*IS;

	//II compartment
	next[4] =
		Fs_1(current, t)*SI - gamma_1*II  +
		Fs_2(current, t)*IS - gamma_2*II;

	//IR compartment
	next[5] =
		Fs_1(current, t)*SR - gamma_1*IR  +
		gamma_2*II - omega_2*IR;

	//RS compartment
	next[6] =
		gamma_1*IS - omega_1*RS  +
		omega_2*RR - Fs_2(current, t)*RS;

	//RI compartment
	next[7] =
		gamma_1*II - omega_1*RI  +
		Fs_2(current, t)*RS - gamma_2*RI;

	//RR compartment
	next[8] =
		gamma_1*IR - omega_1*RR  +
		gamma_2*RI - omega_2*RR;

	return next;
}

// ---------------------------------------------------------------------------- //
// Parameters third order
// ---------------------------------------------------------------------------- //
double Model::I_1(SV current){
	return IS + II + IR;
}

double Model::I_2(SV current){
	return SI + II + RI;
}

double Model::H(SV current){
	return theta_1*I_1(current) + theta_2*I_2(current);
}

double Model::B(SV current){
	return k_min + (1-k_min)/H_thres * epsilon * log( 1 + exp(1/epsilon * (H_thres-H(current))) );
}

double Model::Gamma_1(double t){
	return 1 + nu_1 * cos(2*M_PI * (t+d0_1)/360);
}

double Model::Gamma_2(double t){
	return 1 + nu_2 * cos(2*M_PI * (t+d0_2)/360);
}

double Model::F_1(SV current, double t){
	return k(t) * beta_1 * Gamma_1(t) * (B(current)*I_1(current)+Phi_1(t)/1000.);
}

double Model::F_2(SV current, double t){
	return k(t) * beta_2 * Gamma_2(t) * (B(current)*I_2(current)+Phi_2(t)/1000.);
}

double Model::Fs_1(SV current, double t){
	return (1-sigma_1)*F_1(current, t);
}

double Model::Fs_2(SV current, double t){
	return (1-sigma_2)*F_2(current, t);
}

