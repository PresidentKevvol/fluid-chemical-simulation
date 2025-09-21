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
a_orig_x = 40;
a_orig_y = 78;

den_a[a_orig_x    ][a_orig_y    ] = 25;

den_a[a_orig_x - 1][a_orig_y    ] = 12.5;
den_a[a_orig_x + 1][a_orig_y    ] = 12.5;
den_a[a_orig_x    ][a_orig_y - 1] = 12.5;
den_a[a_orig_x    ][a_orig_y + 1] = 12.5;


velx[a_orig_x    ][a_orig_y    ] = 5;
velx[a_orig_x + 1][a_orig_y - 1] = 3;
velx[a_orig_x + 2][a_orig_y - 2] = 3;
velx[a_orig_x + 3][a_orig_y - 3] = 2;
velx[a_orig_x + 4][a_orig_y - 4] = 2;
velx[a_orig_x + 5][a_orig_y - 5] = 1;

velx[a_orig_x - 1][a_orig_y    ] = 3.5;
velx[a_orig_x + 1][a_orig_y    ] = 3.5;
velx[a_orig_x    ][a_orig_y - 1] = 3.5;
velx[a_orig_x    ][a_orig_y + 1] = 3.5;


vely[a_orig_x    ][a_orig_y    ] = -5;
vely[a_orig_x + 1][a_orig_y - 1] = -3;
vely[a_orig_x + 2][a_orig_y - 2] = -3;
vely[a_orig_x + 3][a_orig_y - 3] = -2;
vely[a_orig_x + 4][a_orig_y - 4] = -2;
vely[a_orig_x + 5][a_orig_y - 5] = -1;

vely[a_orig_x - 1][a_orig_y    ] = -3.5;
vely[a_orig_x + 1][a_orig_y    ] = -3.5;
vely[a_orig_x    ][a_orig_y - 1] = -3.5;
vely[a_orig_x    ][a_orig_y + 1] = -3.5;


b_orig_x = 78;
b_orig_y = 41;

den_b[b_orig_x    ][b_orig_y    ] = 25;

den_b[b_orig_x - 1][b_orig_y    ] = 12.5;
den_b[b_orig_x + 1][b_orig_y    ] = 12.5;
den_b[b_orig_x    ][b_orig_y - 1] = 12.5;
den_b[b_orig_x    ][b_orig_y + 1] = 12.5;


velx[b_orig_x    ][b_orig_y    ] = -5;
velx[b_orig_x - 1][b_orig_y + 1] = -3;
velx[b_orig_x - 2][b_orig_y + 2] = -3;
velx[b_orig_x - 3][b_orig_y + 3] = -2;
velx[b_orig_x - 4][b_orig_y + 4] = -2;
velx[b_orig_x - 5][b_orig_y + 5] = -1;

velx[b_orig_x - 1][b_orig_y    ] = -3.5;
velx[b_orig_x + 1][b_orig_y    ] = -3.5;
velx[b_orig_x    ][b_orig_y - 1] = -3.5;
velx[b_orig_x    ][b_orig_y + 1] = -3.5;


vely[b_orig_x    ][b_orig_y    ] = 5;
vely[b_orig_x - 1][b_orig_y + 1] = 3;
vely[b_orig_x - 2][b_orig_y + 2] = 3;
vely[b_orig_x - 3][b_orig_y + 3] = 2;
vely[b_orig_x - 4][b_orig_y + 4] = 2;
vely[b_orig_x - 5][b_orig_y + 5] = 1;

vely[b_orig_x - 1][b_orig_y    ] = 3.5;
vely[b_orig_x + 1][b_orig_y    ] = 3.5;
vely[b_orig_x    ][b_orig_y - 1] = 3.5;
vely[b_orig_x    ][b_orig_y + 1] = 3.5;

/*
den_b[b_orig_x   ][b_orig_y] = 75;

velx[b_orig_x    ][b_orig_y] = -4;
velx[b_orig_x - 1][b_orig_y] = -4;
velx[b_orig_x - 2][b_orig_y] = -3;
velx[b_orig_x - 3][b_orig_y] = -2;
velx[b_orig_x - 4][b_orig_y] = -1;
velx[b_orig_x - 5][b_orig_y] = -1;

*/



den_a = to_gpu_texture(den_a);
den_b = to_gpu_texture(den_b);
den_c = to_gpu_texture(den_c);
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

    //simulation_loop_interval = setInterval(simulation_step_multi, 25);
    
    simulation_step_multi_gpu();
    gpu_draw_on_canvas_multi(den_a, den_b, den_c, 10);
    
    document.getElementById("start-sim").addEventListener("click", start_simulation);
}

var sim_started = false;

function start_simulation() {
    if (sim_started) {
        return;
    }
    sim_started = true;

    simulation_step_multi_gpu();
    
    simulation_loop_interval = setInterval(simulation_step_multi_gpu, 75);
    window.requestAnimationFrame(simulation_step_multi_gpu_anim_frame);
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
    if (typeof f[0] === 'undefined') {
        return f.toArray();
    }
    
    var r = create_field_grid();
    for (i=1; i<sim_grid_width - 1; i++) {
        for (j=1; j<sim_grid_height - 1; j++) {
            r[i][j] = f[i][j];
        }
    }
    return r;
}

document.addEventListener("DOMContentLoaded", ijs_setup);