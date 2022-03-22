//the diffusion and viscosity factor
var dif_f = 0.0004;
var visc_f = 0.0005;
//time of each tick i.e. dt parametr
var sec_per_tick = 0.025;

var sim_grid_width =  120;
var sim_grid_height = 120;
var size = sim_grid_height * sim_grid_width;

var advection_scale_factor = 30;