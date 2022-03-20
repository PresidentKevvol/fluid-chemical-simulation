var gpu = new GPU();

//test
p = [[2, 4, 5, 3], [1, 8, 5, 2], [6, 7, 0, 8], [1, 4, 4, 1]];
p0 = [[2, 4, 5, 3], [1, 8, 5, 2], [6, 7, 0, 8], [1, 4, 4, 1]];


/*

keep in mind gpu.js use backward index order
thus in a 2D kernel the array index is:
value[this.thread.y][this.thread.x]

therefore the notation should be:
    var i = this.thread.y;
    var j = this.thread.x;

to avoid taking the transpose with every kernel call

*/

var use_pipeline = false;

const empty_field_gpu = gpu.createKernel(function() {return 0;}, {
  output: [sim_grid_width, sim_grid_height],
}).setPipeline(true);

function reset_bound_krnl(b, field){
    if (b === -1) { //if bound type == -1, do nothing
        return field[this.thread.y][this.thread.x];
    }
    
    var i = this.thread.y;
    var j = this.thread.x;
    var w = this.constants.grid_width;
    var h = this.constants.grid_height;

    if (i === 0 && j === 0) {
        return 0.5 * (((b === 2) ? -field[1][1] : field[1][1]) 
                      + ((b === 1) ? -field[1][1] : field[1][1]));
    } else if (i === w - 1 && j === 0) {
        return 0.5 * (((b === 2) ? -field[w - 2][1] : field[w - 2][1]) 
                      + ((b === 1) ? -field[w - 2][1] : field[w - 2][1]));
    } else if (i === 0 && j === h - 1) {
        return 0.5 * (((b === 2) ? -field[1][h - 2] : field[1][h - 2]) 
                      + ((b === 1) ? -field[1][h - 2] : field[1][h - 2]));
    } else if (i === w - 1 && j === h - 1) {
        return 0.5 * (((b === 2) ? -field[w - 2][h - 2] : field[w - 2][h - 2]) 
                      + ((b === 1) ? -field[w - 2][h - 2] : field[w - 2][h - 2]));
    } else if (i === 0) {
        return (b === 1) ? -field[1][j] : field[1][j];
    } else if (j === 0) {
        return (b === 2) ? -field[i][1] : field[i][1];
    } else if (i === w - 1) {
        return (b === 1) ? -field[w - 2][j] : field[w - 2][j];
    } else if (j === h - 1) {
        return (b === 2) ? -field[i][h - 2] : field[i][h - 2];
    } else {
        return field[i][j];
    }
}

const reset_bound_gpu = gpu.createKernel(reset_bound_krnl, {
  constants: { grid_width: sim_grid_width, grid_height: sim_grid_height },
  output: [sim_grid_width, sim_grid_height],
}).setPipeline(use_pipeline);

function diffusion_step_krnl(a, f, f0) {
    var i = this.thread.y;
    var j = this.thread.x;
    var w = this.constants.grid_width;
    var h = this.constants.grid_height;
    
    if (i === 0 || j === 0 || i === w-1 || j === h-1) {
        return f[i][j];
    }
    
    var new_val = ( f_prev[i][j] + a * (f[i][j-1] + f[i][j+1] + f[i-1][j] + f[i+1][j]) ) / (1 + 4*a);
    return new_val;
}

const diffusion_step_gpu = gpu.createKernel(diffusion_step_krnl, {
  constants: { grid_width: sim_grid_width, grid_height: sim_grid_height },
  output: [sim_grid_width, sim_grid_height],
}).setPipeline(use_pipeline);

function diffusion_gpu(b, f, f0, dif, dt) {
    var a = dt * dif * sim_grid_width * sim_grid_height;
    var k;
    
    for (k=0; k<20; k++) {
        f = diffusion_step_gpu(a, f, f0);
        reset_bound_gpu(b, f);
    }
    
    return f;
}

function advection_krnl(f, f0, vx, vy, dt, scan_lim, dt0_x, dt0_y) {
    var i = this.thread.y;
    var j = this.thread.x;
    var w = this.constants.grid_width;
    var h = this.constants.grid_height;
    
    if (i === 0 || j === 0 || i === w-1 || j === h-1) {
        return 0;
    }
    
    var ib = Math.max(0,   i - scan_lim);
    var ic = Math.min(w-1, i + scan_lim);
    var jb = Math.max(0,   j - scan_lim);
    var jc = Math.min(h-1, j + scan_lim);
    
    var res = 0;

    var ia, ja;
    var x, y, s0, t0, s1, t1;
    
    for (ia=ib; ia<=jc; ia++) {
        for (ja=jb; ja<=jc; ja++) {
            //get advection destination location for this cell
            //(where is the velocity pointer pointing to?)
            x = ia + dt0_x * vx[ia][ja];
            y = ja + dt0_y * vy[ia][ja];
            
            //bound/clamp values
            if (x < 0.5) { x = 0.5; }
            if (x > w - 1.5) { x = w - 1.5; }
            if (y < 0.5) { y = 0.5; }
            if (y > h - 1.5) { y = h - 1.5; }
            
            i0 = Math.floor(x);
            i1 = i0 + 1;
            j0 = Math.floor(y);
            j1 = j0 + 1;
        
            s1 = x-i0;
            s0 = 1-s1;
            t1 = y-j0;
            t0 = 1-t1;
            
            if (i0 === i && j0 === j) {
                res += s0 * t0 * f0[ia][ja];
            } else if (i0 === i && j1 === j) {
                res += s0 * t1 * f0[ia][ja];
            } else if (i1 === i && j0 === j) {
                res += s1 * t0 * f0[ia][ja];
            } else if (i1 === i && j1 === j) {
                res += s1 * t1 * f0[ia][ja];
            }
        }
    }
     
    return res;
}

const advection_step_gpu = gpu.createKernel(advection_krnl, {
  constants: { grid_width: sim_grid_width, grid_height: sim_grid_height },
  output: [sim_grid_width, sim_grid_height],
}).setPipeline(use_pipeline);

function advection_gpu(b, f, f0, vel_x, vel_y, dt) {
    var dt0_x = dt * sim_grid_width;
    var dt0_y = dt * sim_grid_height;
    
    var scan_lim = 5;
    
    f = advection_step_gpu(f, f0, vel_x, vel_y, dt, scan_lim, dt0_x, dt0_y);
    f = reset_bound(b, f);
    return f; 
}

//kernel for the divergence (flux) calculating step in projection
function projection_div_krnl(vx, vy, h) {
    var i = this.thread.y;
    var j = this.thread.x;
    var w = this.constants.grid_width;
    var h = this.constants.grid_height;
    
    if (i === 0 || j === 0 || i === w-1 || j === h-1) {
        return 0;
    }
    
    return -0.5 * h * (vx[i+1][j] - vx[i-1][j] + vy[i][j+1] - vy[i][j-1]);
}

//kernel for the G-S relaxation step in projection
//returns the values of p after this step
function projection_gs_rel_krnl(p, div) {
    var i = this.thread.y;
    var j = this.thread.x;
    var w = this.constants.grid_width;
    var h = this.constants.grid_height;
    
    if (i === 0 || j === 0 || i === w-1 || j === h-1) {
        return 0;
    }
    
    return (div[i][j] + p[i-1][j] + p[i+1][j]+ p[i][j-1] + p[i][j+1]) / 4;
}

//kernels for the subtracting step of projection
//one for velocity x and one for y
//returns the new vx and vy
function projectionn_vx_subtract_krnl(vx, p, div, h) {
    var i = this.thread.y;
    var j = this.thread.x;
    var w = this.constants.grid_width;
    var h = this.constants.grid_height;
    
    if (i === 0 || j === 0 || i === w-1 || j === h-1) {
        return 0;
    }
    
    return vx[i][j] - 0.5 * (p[i+1][j] - p[i-1][j]) / h;
}
function projectionn_vy_subtract_krnl(vy, p, div, h) {
    var i = this.thread.y;
    var j = this.thread.x;
    var w = this.constants.grid_width;
    var h = this.constants.grid_height;
    
    if (i === 0 || j === 0 || i === w-1 || j === h-1) {
        return 0;
    }
    
    return vy[i][j] - 0.5 * (p[i][j+1] - p[i][j-1]) / h;
}

const projection_div_gpu = gpu.createKernel(projection_div_krnl, {
  constants: { grid_width: sim_grid_width, grid_height: sim_grid_height },
  output: [sim_grid_width, sim_grid_height],
}).setPipeline(use_pipeline);
const projection_gs_rel_gpu = gpu.createKernel(projection_gs_rel_krnl, {
  constants: { grid_width: sim_grid_width, grid_height: sim_grid_height },
  output: [sim_grid_width, sim_grid_height],
}).setPipeline(use_pipeline);
const projection_vx_subtract_gpu = gpu.createKernel(projection_vx_subtract_krnl, {
  constants: { grid_width: sim_grid_width, grid_height: sim_grid_height },
  output: [sim_grid_width, sim_grid_height],
}).setPipeline(use_pipeline);
const projection_vy_subtract_gpu = gpu.createKernel(projection_vy_subtract_krnl, {
  constants: { grid_width: sim_grid_width, grid_height: sim_grid_height },
  output: [sim_grid_width, sim_grid_height],
}).setPipeline(use_pipeline);

function projection_gpu(vx, vy) {
    var h = 1.0 / sim_grid_height;
    
    var div = projection_div_gpu(vx, vy, h);
    //calculating divergence
    div = reset_bound_gpu(0, div);
    var p = empty_field_gpu();
    
    //Gauss-Seidel relaxation for getting the divergence only field
    for (k=0; k<20; k++) {
        p = projection_gs_rel_gpu(p, div);
    }
    
    //subtract
    vx = projection_vx_subtract_gpu(vx, p, div, h);
    vy = projection_vy_subtract_gpu(vy, p, div, h);

    return [vx, vy];
}
