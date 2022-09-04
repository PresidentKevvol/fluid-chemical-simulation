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
//var k2 = 2.4E6;
var k2 = 2.4E3;

var k3 = 33.6;
//var k4 = 3000;
var k4 = 100;

var kc = 1;

function gen_noise(m, r, rng) {
    var f = create_field_grid();
    var r2 = r / 2;
    var m0 = m - r2;
    for (i=0; i<sim_grid_width; i++) {
        for (j=0; j<sim_grid_height; j++) {
            f[i][j] = m0 + r2 * rng();
        }
    }
    return f;
}

// Make a predictable pseudorandom number generator.
var rng = new Math.seedrandom('chemistry is fun');

//thus, we will create these 6 fields with a random noise in these ranges

var den_A = gen_noise(0.06, 0.008, rng);
var den_B = gen_noise(0.02, 0.002, rng);
var den_P = gen_noise(0.0, 0.0, rng);
var den_X = gen_noise(0.0, 0.0, rng);
var den_Y = gen_noise(0.05, 0.03, rng);
var den_Z = gen_noise(0.002, 0.001, rng);

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

const krnl_constants = { 
    grid_width: sim_grid_width, 
    grid_height: sim_grid_height,
    k1: k1,
    k2: k2,
    k3: k3,
    k4: k4,
    kc: kc
};

const bz_reaction_1_rate = gpu.createKernel(bz_reaction_1_rate_krnl, {
  constants: krnl_constants,
  output: [sim_grid_width, sim_grid_height],
}).setPipeline(use_pipeline).setImmutable(true);
const bz_reaction_2_rate = gpu.createKernel(bz_reaction_2_rate_krnl, {
  constants: krnl_constants,
  output: [sim_grid_width, sim_grid_height],
}).setPipeline(use_pipeline).setImmutable(true);
const bz_reaction_3_rate = gpu.createKernel(bz_reaction_3_rate_krnl, {
  constants: krnl_constants,
  output: [sim_grid_width, sim_grid_height],
}).setPipeline(use_pipeline).setImmutable(true);
const bz_reaction_4_rate = gpu.createKernel(bz_reaction_4_rate_krnl, {
  constants: krnl_constants,
  output: [sim_grid_width, sim_grid_height],
}).setPipeline(use_pipeline).setImmutable(true);
const bz_reaction_c_rate = gpu.createKernel(bz_reaction_c_rate_krnl, {
  constants: krnl_constants,
  output: [sim_grid_width, sim_grid_height],
}).setPipeline(use_pipeline).setImmutable(true);

function bz_reaction_step_a_cappedeuler_krnl(den, rate_1, rate_2, rate_3, rate_4, rate_c, dt) {
    var i = this.thread.y;
    var j = this.thread.x;
    var w = this.constants.grid_width;
    var h = this.constants.grid_height;

    var cur_den = den[i][j];
    var r1 = rate_1[i][j];
    var r2 = rate_2[i][j];
    var r3 = rate_3[i][j];
    var r4 = rate_4[i][j];
    var rc = rate_c[i][j];
    
    var produced = r4;
    var consumed = r1 + r3;
    
    var res = cur_den + produced - consumed;
    
    return res;
}

function bz_reaction_step_b_cappedeuler_krnl(den, rate_1, rate_2, rate_3, rate_4, rate_c, dt) {
    var i = this.thread.y;
    var j = this.thread.x;
    var w = this.constants.grid_width;
    var h = this.constants.grid_height;

    var cur_den = den[i][j];
    var r1 = rate_1[i][j];
    var r2 = rate_2[i][j];
    var r3 = rate_3[i][j];
    var r4 = rate_4[i][j];
    var rc = rate_c[i][j];
    
    var produced = 0
    var consumed = rc;
    
    var res = cur_den + produced - consumed;
    
    return res;
}

function bz_reaction_step_p_cappedeuler_krnl(den, rate_1, rate_2, rate_3, rate_4, rate_c, dt) {
    var i = this.thread.y;
    var j = this.thread.x;
    var w = this.constants.grid_width;
    var h = this.constants.grid_height;

    var cur_den = den[i][j];
    var r1 = rate_1[i][j];
    var r2 = rate_2[i][j];
    var r3 = rate_3[i][j];
    var r4 = rate_4[i][j];
    var rc = rate_c[i][j];
    
    var produced = r1 + 2 * r2 + r4;
    var consumed = 0;
    
    var res = cur_den + produced - consumed;
    
    return res;
}

function bz_reaction_step_x_cappedeuler_krnl(den, rate_1, rate_2, rate_3, rate_4, rate_c, dt) {
    var i = this.thread.y;
    var j = this.thread.x;
    var w = this.constants.grid_width;
    var h = this.constants.grid_height;

    var cur_den = den[i][j];
    
    if (cur_den < -16) {
        return -17;
    }
    
    var r1 = rate_1[i][j];
    var r2 = rate_2[i][j];
    var r3 = rate_3[i][j];
    var r4 = rate_4[i][j];
    var rc = rate_c[i][j];
    
    var produced = r1 + r3;
    var consumed = r2 + 2 * r4;
    
    var res = cur_den + produced - consumed;
    
    return (res < 0) ? -17 : res;
}

function bz_reaction_step_y_cappedeuler_krnl(den, rate_1, rate_2, rate_3, rate_4, rate_c, dt) {
    var i = this.thread.y;
    var j = this.thread.x;
    var w = this.constants.grid_width;
    var h = this.constants.grid_height;

    var cur_den = den[i][j];
    var r1 = rate_1[i][j];
    var r2 = rate_2[i][j];
    var r3 = rate_3[i][j];
    var r4 = rate_4[i][j];
    var rc = rate_c[i][j];
    
    var produced = rc;
    var consumed = r1 + r2;
    
    var res = cur_den + produced - consumed;
    
    return res;
}

function bz_reaction_step_z_cappedeuler_krnl(den, rate_1, rate_2, rate_3, rate_4, rate_c, dt) {
    var i = this.thread.y;
    var j = this.thread.x;
    var w = this.constants.grid_width;
    var h = this.constants.grid_height;

    var cur_den = den[i][j];
    var r1 = rate_1[i][j];
    var r2 = rate_2[i][j];
    var r3 = rate_3[i][j];
    var r4 = rate_4[i][j];
    var rc = rate_c[i][j];
    
    var produced = 2 * r3;
    var consumed = rc;
    
    var res = cur_den + produced - consumed;
    
    return res;
}

const bz_reaction_step_a_cappedeuler = gpu.createKernel(bz_reaction_step_a_cappedeuler_krnl, {
  constants: krnl_constants,
  output: [sim_grid_width, sim_grid_height],
}).setPipeline(use_pipeline).setImmutable(true);
const bz_reaction_step_b_cappedeuler = gpu.createKernel(bz_reaction_step_b_cappedeuler_krnl, {
  constants: krnl_constants,
  output: [sim_grid_width, sim_grid_height],
}).setPipeline(use_pipeline).setImmutable(true);
const bz_reaction_step_p_cappedeuler = gpu.createKernel(bz_reaction_step_p_cappedeuler_krnl, {
  constants: krnl_constants,
  output: [sim_grid_width, sim_grid_height],
}).setPipeline(use_pipeline).setImmutable(true);
const bz_reaction_step_x_cappedeuler = gpu.createKernel(bz_reaction_step_x_cappedeuler_krnl, {
  constants: krnl_constants,
  output: [sim_grid_width, sim_grid_height],
}).setPipeline(use_pipeline).setImmutable(true);
const bz_reaction_step_y_cappedeuler = gpu.createKernel(bz_reaction_step_y_cappedeuler_krnl, {
  constants: krnl_constants,
  output: [sim_grid_width, sim_grid_height],
}).setPipeline(use_pipeline).setImmutable(true);
const bz_reaction_step_z_cappedeuler = gpu.createKernel(bz_reaction_step_z_cappedeuler_krnl, {
  constants: krnl_constants,
  output: [sim_grid_width, sim_grid_height],
}).setPipeline(use_pipeline).setImmutable(true);

function reaction_step_bz(dt) {
    var rate_1 = bz_reaction_1_rate(den_A, den_Y, dt);
    var rate_2 = bz_reaction_2_rate(den_X, den_Y, dt);
    var rate_3 = bz_reaction_3_rate(den_A, den_X, dt);
    var rate_4 = bz_reaction_4_rate(den_X, dt);
    var rate_c = bz_reaction_c_rate(den_B, den_Z, dt);
    
    //add up for the total consumption of each entry in this tick
    /*
    var consumption_a = 
    var consumption_b = 
    var consumption_x = 
    var consumption_y = 
    var consumption_z = 
    */
        
    //den_A = bz_reaction_step_a_cappedeuler(den_A, rate_1, rate_2, rate_3, rate_4, rate_c, dt);
    //den_B = bz_reaction_step_b_cappedeuler(den_B, rate_1, rate_2, rate_3, rate_4, rate_c, dt);
    den_P = bz_reaction_step_p_cappedeuler(den_P, rate_1, rate_2, rate_3, rate_4, rate_c, dt);
    den_X = bz_reaction_step_x_cappedeuler(den_X, rate_1, rate_2, rate_3, rate_4, rate_c, dt);
    den_Y = bz_reaction_step_y_cappedeuler(den_Y, rate_1, rate_2, rate_3, rate_4, rate_c, dt);
    den_Z = bz_reaction_step_z_cappedeuler(den_Z, rate_1, rate_2, rate_3, rate_4, rate_c, dt);
        

    
    rate_1.delete();
    rate_2.delete();
    rate_3.delete();
    rate_4.delete();
    rate_c.delete();
}