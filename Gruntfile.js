module.exports = function (grunt) {
   
   require('load-grunt-tasks')(grunt);
   
   grunt.initConfig({
      babel: {
        options: {
            sourceMap: true,
            presets: ['es2015']
        },
        dist: {
            files: {
                'dist/drd.js': 'src/drd.js'
            }
        }
      },
      watch: {
         scripts: {
            files: ["./src/*.js"],
            tasks: ["babel"]
         }
      }
   });

   
   grunt.loadNpmTasks("grunt-contrib-watch");
   grunt.registerTask("default", ["watch"]);
   grunt.registerTask("build", ["babel"]);
};