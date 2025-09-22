// ---------------------------------------------------------------------------- //
// Class for solving a differntial equation in different manners
// SV = type of state vector defined in model.h
// ---------------------------------------------------------------------------- //

#pragma once
#include <string>
#include <iostream>
#include <cmath>
using namespace std;
#include "model.h"

class Solver
{
// ---------------------------------------------------------------------------- //
// Methods
// ---------------------------------------------------------------------------- //
public:
	Solver(Model _model); //Constructor
	~Solver(); //Deconstructor

	void run(double _SS, double _SI, double _SR,
				 double _IS, double _II, double _IR,
				 double _RS, double _RI, double _RR,
				 double t_max);
	void run(SV initial, double t_max);
	void run(SV initial, double t_max, string method);
	data_struct get_data();
	void set_dt(double _dt);
private:
	SV runge_kutta4(double dt, double t, SV state); //RK4
	SV runge_kutta23(double dt, double t, SV state); //RK23
	

// ---------------------------------------------------------------------------- //
// Vars
// ---------------------------------------------------------------------------- //
public:
	double dt;
	data_struct data;

private:
	Model model;
	double get_next_timestep_adaptive(SV &y, SV &z);
};
