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

//test code
den[4][25] = 25;

den[3][25] = 12.5;
den[5][25] = 12.5;
den[4][24] = 12.5;
den[4][26] = 12.5;


velx[4][25] = 5;
velx[5][24] = 3;
velx[6][23] = 3;
velx[7][22] = 2;
velx[8][21] = 2;
velx[9][20] = 1;

velx[3][25] = 3.5;
velx[5][25] = 3.5;
velx[4][24] = 3.5;
velx[4][26] = 3.5;

    
vely[4][25] = -5;
vely[5][24] = -3;
vely[6][23] = -3;
vely[7][22] = -2;
vely[8][21] = -2;
vely[9][20] = -1;

vely[3][25] = -3.5;
vely[5][25] = -3.5;
vely[4][24] = -3.5;
vely[4][26] = -3.5;

den = to_gpu_texture(den);
velx = to_gpu_texture(velx);
vely = to_gpu_texture(vely);


//the js interval object for the simulation loop
var simulation_loop_interval;

function ijs_setup() {
    main_vas = gpu_draw_canvas;
    document.getElementById('canvas-space').appendChild(main_vas);
    
    //main_vas.setAttribute("width", sim_grid_width);

//    for (var b=0; b<100; b++) {
//        simulation_step_gpu();
//    }
    simulation_loop_interval = setInterval(simulation_step_gpu, 100);
    //simulation_loop_interval = setInterval(simulation_step_multi, 25);
}

function floor_all(f) {
    var r = create_field_grid();
    for (i=1; i<sim_grid_width - 1; i++) {
        for (j=1; j<sim_grid_height - 1; j++) {
            r[i][j] = Math.floor(f[i][j]);
        }
    }
    return r;
}

function clone(f) {
    var r = create_field_grid();
    for (i=1; i<sim_grid_width - 1; i++) {
        for (j=1; j<sim_grid_height - 1; j++) {
            r[i][j] = f[i][j];
        }
    }
    return r;
}

document.addEventListener("DOMContentLoaded", ijs_setup);