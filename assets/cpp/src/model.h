// ---------------------------------------------------------------------------- //
// Class for the model (dgl)
// Contains every non state vector initial values and other functions
// of the model
// ---------------------------------------------------------------------------- //

#pragma once
#include <vector>
#include <array>
#include <string>
#include <iostream>
#include "timeDependentParameter.h"
#include <emscripten/val.h>
using namespace std;
using namespace emscripten;
//Our state vector has size one atm
typedef array<double, 9> SV;

// ---------------------------------------------------------------------------- //
// Main model class
// ---------------------------------------------------------------------------- //
class Model
{
public:
	Model();
	~Model();
	void set_initials(SV initials);
	void set_initials(double _SS, double _SI, double _SR,
					  double _IS, double _II, double _IR,
					  double _RS, double _RI, double _RR);
	SV dgl(double t, SV state);
	void clear(); //Clear the time hs h data

	// Name var can be used for file saveing...
	string name;

	// Parameters first order (time independent)
	// most params are different for disease _1 and _2

	double beta_1					// transmission rate
		= 0.2;
	double beta_2
		= 0.2;
	double gamma_1				// recovery/removal rate
		= 0.1;
	double gamma_2
		= 0.1;
	double omega_1				// immunity waning rate
		= 1/360;
	double omega_2
		= 1/360;
	double sigma_1				// cross-immunity
		= 0.5;
	double sigma_2
		= 0.5;
	double nu_1						// strength of seasonality
		= 0.2;
	double nu_2
		= 0.2;
	double d0_1						// maximum of seasonality
		= 0;
	double d0_2
		= 0;
	double theta_1				// weight of perceived risk
		= 1;
	double theta_2
		= 1;
	double k_min					// minimal possible contact rate
		= 0.2;
	double H_thres				// threshold of perceived risk
		= 0.01;
	double epsilon 				// shape parameter of the softplus function
		= 0.002;

	SV init;

	// Parameters second order (time dependent)
	// small class which allows easy modeling
	TimeDependentParameter k{1}; // Contacts
	TimeDependentParameter Phi_1{1}; // Influx
	TimeDependentParameter Phi_2{1};
	void set_k(TimeDependentParameter k);
	void set_Phi_1(TimeDependentParameter p);
	void set_Phi_2(TimeDependentParameter p);
	TimeDependentParameter get_k();
	TimeDependentParameter get_Phi_1();
	TimeDependentParameter get_Phi_2();

	// Parameters third order (hard coded special behaviour or dependence
	// on other parameters)

	double I_1(SV current);
	double I_2(SV current);
	double H(SV current);
	double B(SV current);
	double Gamma_1(double t);
	double Gamma_2(double t);
	double F_1(SV current, double t);
	double F_2(SV current, double t);
	double Fs_1(SV current, double t);
	double Fs_2(SV current, double t);

	// Data vectors to save a part of the last calculations
	std::vector<double> time;
//	std::vector<double> I_H_tau;
//	std::vector<double> I_Hs_tau;
private:
};


// ---------------------------------------------------------------------------- //
// Data Struct for saving the timeseries of the state vector
// ---------------------------------------------------------------------------- //
struct data_struct{
	vector<double> time;
	vector<SV> system;

	vector<double> SS;
	vector<double> SI;
	vector<double> SR;
	vector<double> IS;
	vector<double> II;
	vector<double> IR;
	vector<double> RS;
	vector<double> RI;
	vector<double> RR;

//	vector<double> N;
//	vector<double> N_obs;

	void clear(){
		time.clear();
		system.clear();
		SS.clear();
		SI.clear();
		SR.clear();
		IS.clear();
		II.clear();
		IR.clear();
		RS.clear();
		RI.clear();
		RR.clear();
	};

	void push_back(double _time, SV _data){
		time.push_back(_time);
		system.push_back(_data);

		SS.push_back(_data[0]);
		SI.push_back(_data[1]);
		SR.push_back(_data[2]);
		IS.push_back(_data[3]);
		II.push_back(_data[4]);
		IR.push_back(_data[5]);
		RS.push_back(_data[6]);
		RI.push_back(_data[7]);
		RR.push_back(_data[8]);
	};

	//Memory view
	val get_time();	//Declaration in communication cpp
	val get_SS();
	val get_SI();
	val get_SR();
	val get_IS();
	val get_II();
	val get_IR();
	val get_RS();
	val get_RI();
	val get_RR();

};
