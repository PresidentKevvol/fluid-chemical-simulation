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

//map x from (e^min, e^max) to (0, 1)
function value_mapping_2(x, min, max) {
    var v = x;
    if (v > 0) {
        v = Math.log(v)
        v = (v < min) ? min : v;
        v = (v > max) ? max : v;
        v = (v - min) / (max - min);
    } else {
        v = 0;
    }
    return v;
}

//map x from (0, max) to (0, 1)
function value_mapping_3(x, max) {
    var v = x;
    if (v > 0) {
        v = (v > max) ? max : v;
        v /= max;
    } else {
        v = 0;
    }
    return v;
}