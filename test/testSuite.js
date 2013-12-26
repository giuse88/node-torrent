/**
 * Created with JetBrains WebStorm.
 * User: giuseppe
 * Date: 22/12/2013
 * Time: 21:04
 * To change this template use File | Settings | File Templates.
 */


exports.testSomething = function(test){
    test.expect(1);
    test.ok(true, "this assertion should pass");
    test.done();
};

/*
exports.testSomethingElse = function(test){
    test.ok(false, "this assertion should fail");
    test.done();
};

*/