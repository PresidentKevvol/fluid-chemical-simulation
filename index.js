var main_vas;
var main_ctx;

var p;

//the diffusion and viscosity factor
var dif_f = 0.0002;
var visc_f = 0.00025;
//time of each tick i.e. dt parametr
var sec_per_tick = 0.025;

var sim_grid_width = 30;
var sim_grid_height = 30;
var size = sim_grid_height * sim_grid_width;
/*
function create_field_grid() {
    return nj.zeros([sim_grid_height, sim_grid_width], 'float64');
}
*/
function create_field_grid() {
    var f = [];
    for (i=0; i<sim_grid_width; i++) {
        f.push(new Array(sim_grid_height).fill(0));
    }
    return f;
}

function sum_field(f) {
    var res = 0;
    for (i=0; i<sim_grid_width; i++) {
        for (j=0; j<sim_grid_height; j++) {
            res += f[i][j];
        }
    }
    return res;
}

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

//add source, reset boundary, diffuse, advect, and project function
//used in the simulation
//code cited directly from [stam 2003] and modified to javascript
function add_source(x, s, dt) {
    for (i=1; i<sim_grid_width - 1; i++) {
        for (j=1; j<sim_grid_height - 1; j++) {
            x[i][j] += dt * s[i][j];
        }
    }
}

//field will be changed
function reset_bound(b, field) {
    if (b === -1) {
        return;
    }
    
    var i, j;
    
    for (i=1; i<sim_grid_width - 1 ; i++) {
        field[i][0]   = (b === 2) ? -field[i][1] : field[i][1];
        field[i][sim_grid_height - 1] = (b === 2) ? -field[i][sim_grid_height - 2] : field[i][sim_grid_height - 2];
    }
    for (j=1; j<sim_grid_height - 1; j++) {
        field[0][j]   = (b === 1) ? -field[1][j] : field[1][j];
        field[sim_grid_width - 1][j] = (b === 1) ? -field[sim_grid_width - 2][j] : field[sim_grid_width - 2][j];
    }
    
    field[0][0] = 0.5*(field[1][0] + field[0][1]);
    field[0][sim_grid_height - 1] = 0.5*(field[1][sim_grid_height - 1] + field[0][sim_grid_height - 2]);
    field[sim_grid_width - 1][0] = 0.5*(field[sim_grid_width - 2][0] + field[sim_grid_width - 1][1]);
    field[sim_grid_width - 1][sim_grid_height - 1] = 0.5*(field[sim_grid_width - 2][sim_grid_height - 1] + field[sim_grid_width - 1][sim_grid_height - 2]);
}

//f will be changed
function diffusion(b, f, f_prev, dif, dt) {
    var a = dt * dif * sim_grid_width * sim_grid_height;
    var i, j, k, m, n;
    var new_val;
    
    for (k=0; k<20; k++) {
        for (i=1; i<sim_grid_width - 1; i++) {
            for (j=1; j<sim_grid_height - 1; j++) {
                new_val = ( f_prev[i][j] + a * (f[i][j-1] + f[i][j+1] + f[i-1][j] + f[i+1][j]) ) / (1 + 4*a);
                
                f[i][j]= new_val;
            }
        }
        /*
        m = sim_grid_height - 1;
        for (i=1; i<sim_grid_width - 1; i++) {
            f[i][0] = ( f_prev[i][0] + a * (f[i][1] + f[i-1][0] + f[i+1][0]) ) / (1 + 3*a);
            f[i][m] = ( f_prev[i][m] + a * (f[i][m-1] + f[i-1][m] + f[i+1][m]) ) / (1 + 3*a);
        }
        
        n = sim_grid_width - 1;
        for (j=1; j<sim_grid_height - 1; j++) {
            f[0][j] = ( f_prev[0][j] + a * (f[1][j] + f[0][j-1] + f[0][j+1]) ) / (1 + 3*a);
            f[n][j] = ( f_prev[n][j] + a * (f[n-1][j] + f[n][j-1] + f[n][j+1]) ) / (1 + 3*a);
        }
        
        f[0][0] = ( f_prev[0][0] + a * (f[1][0] + f[0][1]) ) / (1 + 2*a);
        f[n][0] = ( f_prev[n][0] + a * (f[n-1][0] + f[n][1]) ) / (1 + 2*a);
        f[0][m] = ( f_prev[0][m] + a * (f[1][m] + f[0][m-1]) ) / (1 + 2*a);
        f[n][m] = ( f_prev[n][m] + a * (f[n-1][m] + f[n][m-1]) ) / (1 + 2*a);
        */
    
        reset_bound(b, f);
    }
    
    

    //return f;
}

//f will be changed
/*
function advection(b, f, f_prev, vel_x, vel_y, dt) {
    var x, y, s0, t0, s1, t1, dt0_x, dt0_y;
    var i, j;
    var new_val;
    
    dt0_x = dt * sim_grid_width;
    dt0_y = dt * sim_grid_height;
    
    for (i=1; i<sim_grid_width - 1; i++) {
        for (j=1; j<sim_grid_height - 1; j++) {
            //get advection source location for this cell
            x = i - dt0_x * vel_x[i][j];
            y = j - dt0_y * vel_y[i][j];
            
            //bound/clamp values
            if (x < 0.5) { x = 0.5; }
            if (x > sim_grid_width - 0.5) { x = sim_grid_width - 0.5; }
            if (y < 0.5) { y = 0.5; }
            if (y > sim_grid_height - 0.5) { y = sim_grid_height - 0.5; }
            
            i0 = Math.floor(x);
            i1 = i0 + 1;
            j0 = Math.floor(y);
            j1 = j0 + 1;
        
            s1 = x-i0;
            s0 = 1-s1;
            t1 = y-j0;
            t0 = 1-t1;
            
            new_val = s0 * (t0*f_prev[i0][j0] + t1*f_prev[i0][j1]) + s1 * (t0*f_prev[i1][j0] + t1*f_prev[i1][j1]);
            f[i][j] = new_val;
        }
    }
    
    reset_bound(b, f);
}
*/
//alternate advection function
function advection(b, f, f_prev, vel_x, vel_y, dt) {
    var x, y, s0, t0, s1, t1, dt0_x, dt0_y;
    var i, j;
    var new_val;
    
    dt0_x = dt * sim_grid_width;
    dt0_y = dt * sim_grid_height;
    
    for (i=0; i<sim_grid_width; i++) {
        for (j=0; j<sim_grid_height; j++) {
            f[i][j] = 0;
        }
    }

    for (i=1; i<sim_grid_width-1; i++) {
        for (j=1; j<sim_grid_height-1; j++) {
            //get advection destination location for this cell
            //(where is the velocity pointer pointing to?)
            x = i + dt0_x * vel_x[i][j];
            y = j + dt0_y * vel_y[i][j];
            
            //bound/clamp values
            if (x < 0.5) { x = 0.5; }
            if (x > sim_grid_width - 1.5) { x = sim_grid_width - 1.5; }
            if (y < 0.5) { y = 0.5; }
            if (y > sim_grid_height - 1.5) { y = sim_grid_height - 1.5; }
            
            i0 = Math.floor(x);
            i1 = i0 + 1;
            j0 = Math.floor(y);
            j1 = j0 + 1;
        
            s1 = x-i0;
            s0 = 1-s1;
            t1 = y-j0;
            t0 = 1-t1;
            
            //console.log(i0 + " " + i1 + " " + j0 + " " + j1);
            
            //f[i][j] = s0 * (t0*f_prev[i0][j0] + t1*f_prev[i0][j1]) + s1 * (t0*f_prev[i1][j0] + t1*f_prev[i1][j1]);
            f[i0][j0] += s0 * t0 * f_prev[i][j];
            f[i0][j1] += s0 * t1 * f_prev[i][j];
            f[i1][j0] += s1 * t0 * f_prev[i][j];
            f[i1][j1] += s1 * t1 * f_prev[i][j];
        }
    }
    
    reset_bound(b, f);
}

//vx, vy will be changed
function projection(vx, vy, p, div) {
    var i, j, k; var h = 1.0 / sim_grid_height;

    //calculating divergence
    for (i=1; i<sim_grid_width - 1; i++) {
        for (j=1; j<sim_grid_height - 1; j++) {
            div[i][j] = -0.5 * h * (vx[i+1][j] - vx[i-1][j] + vy[i][j+1] - vy[i][j-1]);
            p[i][j] = 0;
        }
    }
    reset_bound(0, div);
    reset_bound(0, p);
    
    //Gauss-Seidel relaxation for getting the divergence only field
    for (k=0; k<20; k++) {
        for (i=1; i<sim_grid_width - 1; i++) {
            for (j=1; j<sim_grid_height - 1; j++) {
                p[i][j] = (div[i][j] + p[i-1][j] + p[i+1][j]+ p[i][j-1] + p[i][j+1]) / 4;
            }
        }
        reset_bound(0, p);
    }

    //subtract
    for (i=1; i<sim_grid_width - 1; i++) {
        for (j=1; j<sim_grid_height - 1; j++) {
            vx[i][j] -= 0.5 * (p[i+1][j] - p[i-1][j]) / h;
            vy[i][j] -= 0.5 * (p[i][j+1] - p[i][j-1]) / h;
        }
    }
    reset_bound(1, vx);
    reset_bound(2, vy);
}

//d will be changed, rest unchanged
function density_step(dif, dt) {
    [den, den_prev] = [den_prev, den];
    diffusion(0, den, den_prev, dif, dt);
    
    [den, den_prev] = [den_prev, den];
    advection(0, den, den_prev, velx, vely, dt);
}

//the simulation tick routine for multiple substances 
function density_step_multi(dif, dt) {
    [den_a, den_a_prev] = [den_a_prev, den_a];
    [den_b, den_b_prev] = [den_b_prev, den_b];
    [den_c, den_c_prev] = [den_c_prev, den_c];
    diffusion(0, den_a, den_a_prev, dif, dt);
    diffusion(0, den_b, den_b_prev, dif, dt);
    diffusion(0, den_c, den_c_prev, dif, dt);
    
    [den_a, den_a_prev] = [den_a_prev, den_a];
    [den_b, den_b_prev] = [den_b_prev, den_b];
    [den_c, den_c_prev] = [den_c_prev, den_c];
    advection(0, den_a, den_a_prev, velx, vely, dt);
    advection(0, den_b, den_b_prev, velx, vely, dt);
    advection(0, den_c, den_c_prev, velx, vely, dt);
}

function velocity_step(visc, dt) {
    //swap so the current field calculated last tick becomes previous
    //and previous becomes current to be updated
    [velx_prev, velx] = [velx, velx_prev];
    [vely_prev, vely] = [vely, vely_prev];
    //velocity diffusion
    diffusion(1, velx, velx_prev, visc, dt);
    diffusion(2, vely, vely_prev, visc, dt);
    //remove flux
    projection(velx, vely, plhl_p, plhl_d);
    
    //swap again
    [velx_prev, velx] = [velx, velx_prev];
    [vely_prev, vely] = [vely, vely_prev];
    //velocity self advection
    advection(1, velx, velx_prev, velx_prev, vely_prev, dt);
    advection(2, vely, vely_prev, velx_prev, vely_prev, dt);
    //remove flux
    projection(velx, vely, plhl_p, plhl_d);
}

//one simulation tick
//code cited directly from [stam 2003]
function simulation_step() {
    //get_input(); //get input from ui (optional for now?)
    velocity_step(dif_f, sec_per_tick); //evolve velocity
    density_step(visc_f, sec_per_tick); //evolve density
    draw_on_canvas(den, main_ctx, 10);   //draw density array on canvas
    
    //optional debug
    console.log("sum of density: " + sum_field(den));
}

//the simulation step for multiple chemicals
function simulation_step_multi() {
    //get_input(); //get input from ui (optional for now?)
    velocity_step(dif_f, sec_per_tick); //evolve velocity
    density_step_multi(visc_f, sec_per_tick); //evolve density
    draw_on_canvas_multi(den_a, den_b, den_c, main_ctx, 10);   //draw density array on canvas
    
    //optional debug
    //console.log("sum of density: " + sum_field(den));
}

var ctx_h = 1000; var ctx_w = 1000;
//function to draw field on the canvas
function draw_on_canvas(f, vas_ctx, maxval) {
    var imd = vas_ctx.createImageData(sim_grid_width, sim_grid_height);
    var idx = 0;
    var i,j;
    for (j=0; j<sim_grid_height; j++) {
        for (i=0; i<sim_grid_width; i++) {
            var v = f[i][j];
            if (v !== 0) {
                v = Math.log(v) + 5;
                v = (v > maxval) ? maxval : v;
                v = (v < 0) ? 0 : v;
            } else {
                v = 0;
            }
                        
            imd.data[idx] = 0;
            imd.data[idx + 1] = 0;
            imd.data[idx + 2] = 255;
            imd.data[idx + 3] = v / maxval * 255;
            
            idx += 4;
        }
    }
    //draw on destination canvas
    vas_ctx.putImageData(imd, 0, 0, 0, 0, ctx_w, ctx_h);
}

function value_mapping(x, maxval) {
    var v = x;
    if (v !== 0) {
        v = Math.log(v) + 5;
        v = (v > maxval) ? maxval : v;
        v = (v < 0) ? 0 : v;
    } else {
        v = 0;
    }
    return v;
}

//draw multiple substances' density on canvas
//the chemical reaction goes:
//A(red) + B(blue) -> C(green)
function draw_on_canvas_multi(fa, fb, fc, vas_ctx, maxval) {
    var imd = vas_ctx.createImageData(sim_grid_width, sim_grid_height);
    var idx = 0;
    var i,j, va, vb, vc;
    for (j=0; j<sim_grid_height; j++) {
        for (i=0; i<sim_grid_width; i++) {
            va = value_mapping(fa[i][j], maxval);
            vb = value_mapping(fb[i][j], maxval);
            vc = value_mapping(fc[i][j], maxval);

                        
            imd.data[idx]     = va / maxval * 255;
            imd.data[idx + 1] = vc / maxval * 255;
            imd.data[idx + 2] = vb / maxval * 255;
            imd.data[idx + 3] = 255;
            
            idx += 4;
        }
    }
    //draw on destination canvas
    vas_ctx.putImageData(imd, 0, 0, 0, 0, ctx_w, ctx_h);
}

function generate_random_field(minval, maxval) {
    var f = create_field_grid();
    
    var i,j;
    for (i=0; i<sim_grid_width; i++) {
        for (j=0; j<sim_grid_height; j++) {
            f[i][j] = Math.random() * (maxval - minval) + minval;
        }
    }
    
    return f;
}

//the js interval object for the simulation loop
var simulation_loop_interval;

function ijs_setup() {
    main_vas = document.getElementById("main-vas");
    main_ctx = main_vas.getContext('2d');
    main_ctx.imageSmoothingEnabled = false;
    
    //draw_on_canvas(p, main_ctx, 10);

    var test_sim_step = function() {
        var p1 = create_field_grid();
        diffusion(0, p1, p, 0.0005, 0.025);
        p = p1;
        draw_on_canvas(p, main_ctx, 10);
    };
    
    draw_on_canvas_multi(den_a, den_b, den_c, main_ctx, 10);
    //simulation_loop_interval = setInterval(simulation_step, 25);
    simulation_loop_interval = setInterval(simulation_step_multi, 25);
}

document.addEventListener("DOMContentLoaded", ijs_setup);