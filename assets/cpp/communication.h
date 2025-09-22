#pragma once
#include "src/solver.h"
#include "src/utils.h"
#include "src/model.h"
#include "src/timeDependentParameter.h"
#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>
using namespace emscripten;
// ---------------------------------------------------------------------------- //
// Utils
// ---------------------------------------------------------------------------- //

// ---------------------------------------------------------------------------- //
// Data struct
// ---------------------------------------------------------------------------- //

EMSCRIPTEN_BINDINGS(data) {
	class_<data_struct>("data_struct")
		.constructor<>()

		//Function for each compartment
		.function("time",&data_struct::get_time)

		//Total pools
		.function("SS", &data_struct::get_SS)
		.function("SI", &data_struct::get_SI)
		.function("SR", &data_struct::get_SR)
		.function("IS", &data_struct::get_IS)
		.function("II", &data_struct::get_II)
		.function("IR", &data_struct::get_IR)
		.function("RS", &data_struct::get_RS)
		.function("RI", &data_struct::get_RI)
		.function("RR", &data_struct::get_RR);

	register_vector<double>("vector<double>");
}



// ---------------------------------------------------------------------------- //
// TimeDependentParameter
// ---------------------------------------------------------------------------- //

EMSCRIPTEN_BINDINGS(timeDependentParameter) {
	class_<TimeDependentParameter>("TimeDependentParameter")
		.constructor<double>()

		//Vars
		.function("eval",&TimeDependentParameter::operator())
		.function("add_change",select_overload<void(double,double,double)>(&TimeDependentParameter::add_change))
		.function("add_inputevent",select_overload<void(double,double,double)>(&TimeDependentParameter::add_inputevent))
		.function("update_change",select_overload<void(int,double,double,double)>(&TimeDependentParameter::update_change))
		.function("update_inputevent",select_overload<void(int,double,double,double)>(&TimeDependentParameter::update_inputevent))
		.property("initial",&TimeDependentParameter::initial_value);
}


// ---------------------------------------------------------------------------- //
// MODEL
// ---------------------------------------------------------------------------- //

EMSCRIPTEN_BINDINGS(model) {
	class_<Model>("Model")
		.constructor<>()

		//Vars
		.property("beta_1",&Model::beta_1)
		.property("beta_2",&Model::beta_2)
		.property("gamma_1",&Model::gamma_1)
		.property("gamma_2",&Model::gamma_2)
		.property("omega_1",&Model::omega_1)
		.property("omega_2",&Model::omega_2)
		.property("sigma_1",&Model::sigma_1)
		.property("sigma_2",&Model::sigma_2)
		.property("nu_1",&Model::nu_1)
		.property("nu_2",&Model::nu_2)
		.property("d0_1",&Model::d0_1)
		.property("d0_2",&Model::d0_2)
		.property("theta_1",&Model::theta_1)
		.property("theta_2",&Model::theta_2)
		.property("k_min",&Model::k_min)
		.property("H_thres",&Model::H_thres)

		.property("k_t",&Model::k)
		.property("Phi_1_t",&Model::Phi_1)
		.property("Phi_2_t",&Model::Phi_2);

}

// ---------------------------------------------------------------------------- //
// Solver
// ---------------------------------------------------------------------------- //

EMSCRIPTEN_BINDINGS(solver) {
	class_<Solver>("Solver")
		.constructor<Model>()

		//Functions
		.function("set_dt",&Solver::set_dt)
		.function("get_data",&Solver::get_data)
		.function("run",select_overload<void(double, double, double, double, double, double, double, double, double, double)>(&Solver::run));

}