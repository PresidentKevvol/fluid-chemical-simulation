var main_vas;
var main_ctx;

var p;

//the field grid for x,y velocity and density
var velx = create_field_grid();
var vely = create_field_grid();
var den = create_field_grid();

var den_a = create_field_grid();
var den_b = create_field_grid();
var den_c = create_field_grid();

//the field grid for x,y velocity and density of the previous tick
var velx_prev = create_field_grid();
var vely_prev = create_field_grid();
var den_prev = create_field_grid();

var den_a_prev = create_field_grid();
var den_b_prev = create_field_grid();
var den_c_prev = create_field_grid();

//placeholder arrays so simulation code don't create new ones every time needed
var plhl_p = create_field_grid();
var plhl_d = create_field_grid();


//the js interval object for the simulation loop
var simulation_loop_interval;

function ijs_setup() {
    main_vas = document.getElementById("main-vas");
    main_ctx = main_vas.getContext('2d');
    
    main_vas.setAttribute("width", sim_grid_width);
    main_vas.setAttribute("height", sim_grid_height);

    
    draw_on_canvas_multi(den_a, den_b, den_c, main_ctx, 10);
    //simulation_loop_interval = setInterval(simulation_step, 25);
    simulation_loop_interval = setInterval(simulation_step_multi, 25);
}

document.addEventListener("DOMContentLoaded", ijs_setup);