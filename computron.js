const log4js = require('log4js')
const os = require("os")

function makeGlobals() {
    // Globals & defaults
    console.log("Creating global variables")
    global.logger = null
    global.logger_solutions = null
    global.logger_breakers = null
    global.dimensions = 3n
    global.cube_size = 1000n
    global.log_every_x = 1e9
    global.iteration_counter = 0
    // See make_powers()
    global.powers_n0 = []
    global.powers_n1 = []
    global.powers_s0 = []
    global.powers_s1 = {}
    // Hash tables for solutions and rule breakers
    // let global.solutions = {}
    // let global.breakers  = {}
    global.origin = []
}

function checkArguments() {
    // Check arguments and override defaults
    const args = process.argv.slice(2);
    if (args.length == 0) {
        console.warn(`Usage: ${__filename} <dimensions> <cube size> <log every X iterations>`)
        console.warn(`The defaults are ${dimensions}, ${cube_size}, and ${log_every_x}`)
    } else {
        if (args.length > 0) {
            dimensions = BigInt(args[0])
        }
        if (args.length > 1) {
            cube_size = BigInt(args[1])
        }
        if (args.length > 2) {
            log_every_x = BigInt(args[2])
        }
    }
}
function log_params() {
    logger.info('# STARTING')
    // Log parameters and environment
    logger.info(`Dimensions    : ${dimensions}`)
    logger.info(`Cube size     : ${cube_size}`)
    logger.info(`Log batches of: ${log_every_x}`)
    logger.info(`Directory     : ${__dirname}`);
}
function configure_logging() {
    log4js.configure({
        appenders: {
            out:  {
                type: 'stdout'
            }, 
            full: {
                type: "fileSync", 
                filename: __dirname + `/results_temp/${dimensions}D_${cube_size}.log`
            },
            solution: {
                type: "fileSync", 
                filename: __dirname + `/results_temp/${dimensions}D_${cube_size}_solutions.csv`, 
                layout: {type: 'pattern', pattern: '%m'}
            },
            breaker: {
                type: "fileSync", 
                filename: __dirname + `/results_temp/${dimensions}D_${cube_size}_breakers.csv`, 
                layout: {type: 'pattern', pattern: '%m'}
            } 
        },
        categories: {
            default: {
                appenders: ['out', 'full'], 
                level: 'info'
            },
            solution: {
                appenders: ['solution'], 
                level: 'info'
            },
            breaker: {
                appenders: ['breaker'], 
                level: 'info'
            }
        }
    });
    logger = log4js.getLogger('default')
    logger_solutions = log4js.getLogger('solution')
    logger_breakers = log4js.getLogger('breaker')
}
function make_powers() {
    /*
        powers_n0 and powers_n1:
        Arrays to cache the powers of the numbers. Caching and looking them up
        is much faster than calculating in every iteration. Array of ^(n) will
        be used in checking solutions, while ^(n+1) is for rule breakers.
    */
    powers_n0 = []
    powers_n1 = []
    for (let i = 0n; i <= cube_size; i++) {
        powers_n0.push(i ** dimensions)
        powers_n1.push(i ** (dimensions + 1n))
    }
    logger.info(`Cache to create sums: [1^${dimensions} .. ${cube_size}^${dimensions}]`)
    logger.info(`Cache to create sums: [1^${dimensions + 1n} .. ${cube_size}^${dimensions + 1n}]`)

    /*
        powers_s0 and powers_s1:
        Array of bigints containing the numbers up to the possible maximum 
    */
    powers_s0 = {}
    powers_s1 = {}
    const max0 = dimensions * ((cube_size + 1n) ** dimensions)
    const max1 = dimensions * ((cube_size + 1n) ** (dimensions +1n))
    let loop_v0 = loop_v1 = 1n
    let loop_p0 = loop_v0 ** dimensions
    let loop_p1 = loop_v1 ** (dimensions + 1n)

    while (loop_p0 <= max0) {
        powers_s0[loop_p0] = loop_v0
        loop_v0 += 1n
        loop_p0 = loop_v0 ** dimensions
    }
    const max_val0 = (loop_v0 - 1n) ** dimensions
    logger.info(`Object to check roots: up to ${max_val0} for ${powers_s0[max_val0]}`)

    while (loop_p1 <= max1) {
        powers_s1[loop_p1] = loop_v1
        loop_v1 += 1n
        loop_p1 = loop_v1 ** (dimensions + 1n)
    }
    const max_val1 = (loop_v1 - 1n) ** (dimensions + 1n)
    logger.info(`Object to check roots: up to ${max_val1} for ${powers_s1[max_val1]}`)
}
function save_result(combination, n_plus_1) {
    const list = combination.join(',') + ',' + n_plus_1
    logger.info(`Solution found: ${list}`)
    logger_solutions.info(`${list}`)
}
function check_combination(combination) {
    let sum_n0 = sum_n1 = 0n
    for (let i = 0; i < Number(dimensions); i++) {
        sum_n0 += powers_n0[combination[i]]
        sum_n1 += powers_n1[combination[i]]
    }
    // z is the final, (n+1)th integer
    let z
    // check roots
    const r0 = powers_s0[sum_n0]
    const r1 = powers_s1[sum_n1]
    // console.log(combination, sum_n0, r0)
    // console.log(combination, sum_n1, r1)
    if (r0 != undefined) {
        save_result(combination, r0)
    }
    if (r1 != undefined) {
        const b = `Rule breaker: ${combination.join(',')},${r1}`
        logger.error(b)
        logger_breakers.info(b)
    }
}
function recursive_combination(dimension, combination) {
    /*
        This is a recursive function.
        In dimension-specific  implementations this could be just FOR loops
        embedded into each other. Eg 3 embedded FOR loops for 3 dimensions,
        etc.  The generic algorythm must be recursive  to support arbitrary
        number of dimensions.
    */
    while (combination[dimension] < cube_size) {
        if (dimension < (dimensions - 1n)) {
            recursive_combination((dimension + 1), combination)
        }
        combination[dimension] += 1n
        if (dimension < (dimensions - 1n)) {
            for (let i = dimension; i < dimensions; i++) combination[i] = combination[dimension]
        }
        check_combination(combination)
        iteration_counter++
        if (iteration_counter == log_every_x) {
            logger.info("Processing @", combination.join(','))
            iteration_counter = 0
        }
    }
}
function startup() {
    // Starts here
    makeGlobals()
    checkArguments()
    configure_logging()
    log_params()
    make_powers()

    // Prepare a starting combination called origin
    for (let i = 0; i < Number(dimensions); i++) {origin[i] = 1n}
    check_combination(origin)
}

// WARNING: this is still single-core! 
// Don't try anything above 4 dimensions and 1000^4 cube unless you're really bored of your life.
startup()
recursive_combination(0, origin)
