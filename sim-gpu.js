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
});

function diffusion_step_krnl(a, f, f0) {
    var i = this.thread.y;
    var j = this.thread.x;
    
    var new_val = ( f_prev[i][j] + a * (f[i][j-1] + f[i][j+1] + f[i-1][j] + f[i+1][j]) ) / (1 + 4*a);
    return new_val;
}

const diffusion_step_gpu = gpu.createKernel(diffusion_step_krnl, {
  constants: { grid_width: sim_grid_width, grid_height: sim_grid_height },
  output: [sim_grid_width, sim_grid_height],
});

function diffusion_gpu(b, f, f0, dif, dt) {
    var a = dt * dif * sim_grid_width * sim_grid_height;
    var k;
    
    for (k=0; k<20; k++) {
        f = diffusion_step_gpu(a, f, f0);
        reset_bound_gpu(b, f);
    }
    
    return f;
}