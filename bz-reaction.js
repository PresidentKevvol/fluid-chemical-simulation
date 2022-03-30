/*
following file is for simulating the Belousov-Zhabotinsky reaction using this project

it can be abstractified to 5 macro steps:
A  + Y -> X  + P
X  + Y -> 2P
A  + X -> 2X + 2Z
2X     -> A  + P 
B  + Z -> Y
[Field, Koros, Noyes 1976]
*/

//reaction rate constants
var k1 = 1.28;
var k2 = 2.4E6;
var k3 = 33.6;
var k4 = 3000;
var kc = 1;

function gen_noise(m, r, rng) {
    var f = create_field_grid();
    var r2 = r / 2;
    var m0 = m - r2;
    for (i=0; i<sim_grid_width; i++) {
        for (j=0; j<sim_grid_height; j++) {
            f[i][j] = m0 + r2 * rng;
        }
    }
    return f;
}

// Make a predictable pseudorandom number generator.
var rng = new Math.seedrandom('chemistry is fun');

//thus, we will create these 6 fields with a random noise in these ranges

var den_A = gen_noise(0.06, 0.005, rng);
var den_B = gen_noise(0.02, 0.0015, rng);
var den_P = gen_noise(0.0, 0.0, rng);
var den_X = gen_noise(0.02, 0.0015, rng);
var den_Y = gen_noise(0.02, 0.0015, rng);
var den_Z = gen_noise(0.02, 0.0015, rng);

function density_step_bz(dif, dt) {
    den_A = diffusion_gpu(0, den_A, dif, dt);
    den_B = diffusion_gpu(0, den_B, dif, dt);
    den_P = diffusion_gpu(0, den_P, dif, dt);
    den_X = diffusion_gpu(0, den_X, dif, dt);
    den_Y = diffusion_gpu(0, den_Y, dif, dt);
    den_Z = diffusion_gpu(0, den_Z, dif, dt);
    
    den_A = advection_gpu(0, den_A, velx, vely, dt);
    den_B = advection_gpu(0, den_B, velx, vely, dt);
    den_P = advection_gpu(0, den_P, velx, vely, dt);
    den_X = advection_gpu(0, den_X, velx, vely, dt);
    den_Y = advection_gpu(0, den_Y, velx, vely, dt);
    den_Z = advection_gpu(0, den_Z, velx, vely, dt);
}

function bz_reaction_1_rate_krnl(fa, fy, dt) {
    var i = this.thread.y;
    var j = this.thread.x;
    var w = this.constants.grid_width;
    var h = this.constants.grid_height;
    
    var da = fa[i][j];
    var dy = fy[i][j];
    
    var rate = this.constants.k1 * da * dy * dt;
    
    return rate;
}
function bz_reaction_2_rate_krnl(fx, fy, dt) {
    var i = this.thread.y;
    var j = this.thread.x;
    var w = this.constants.grid_width;
    var h = this.constants.grid_height;
    
    var dx = fx[i][j];
    var dy = fy[i][j];
    
    var rate = this.constants.k2 * dx * dy * dt;
    
    return rate;
}
function bz_reaction_3_rate_krnl(fa, fx, dt) {
    var i = this.thread.y;
    var j = this.thread.x;
    var w = this.constants.grid_width;
    var h = this.constants.grid_height;
    
    var da = fa[i][j];
    var dx = fx[i][j];
    
    var rate = this.constants.k3 * da * dx * dt;
    
    return rate;
}
function bz_reaction_4_rate_krnl(fx, dt) {
    var i = this.thread.y;
    var j = this.thread.x;
    var w = this.constants.grid_width;
    var h = this.constants.grid_height;
    
    var dx = fx[i][j];
    
    var rate = this.constants.k4 * dx * dx * dt;
    
    return rate;
}
function bz_reaction_c_rate_krnl(fb, fz, dt) {
    var i = this.thread.y;
    var j = this.thread.x;
    var w = this.constants.grid_width;
    var h = this.constants.grid_height;
    
    var db = fb[i][j];
    var dz = fz[i][j];
    
    var rate = this.constants.kc * db * dz * dt;
    
    return rate;
}

function reaction_step_bz(dt) {
    var rate_1 = bz_reaction_1_rate(den_A, den_Y, dt);
    var rate_2 = bz_reaction_2_rate(den_X, den_Y, dt);
    var rate_3 = bz_reaction_3_rate(den_A, den_X, dt);
    var rate_4 = bz_reaction_4_rate(den_X, dt);
    var rate_c = bz_reaction_c_rate(den_B, den_Z, dt);
    
    den_a = subtraction_gpu(den_a, rate);
    den_c = addition_gpu(den_c, rate);

    rate.delete();
}