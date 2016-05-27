define(["jquery", "underscore"], function($, _) {
    //注意出来的数据 存在的项 更改使其对应，不存在的设置一个名称， 以确保表格每项都有值, (多的丢弃，少的置空)
    //接受数据库后 格式化，以及发送数据的格式， 都是它  
    var Attribute = {
        //ID 相当于键值， 首先给它赋 对应项
        ID: "ID",
        A: "A",
        B: "B",
        C: "C",
        D: "D",
        Remark: "Remark"
    };


    var Pattern = {
        StudentNum: {
            all: /^\s*311\d{7}\s*$/,
            simple: /\b311\d{7}\b/
        },
        DormitoryNum: {
            all: /^\s*\d{6}\s*$/,
            simple: /\b\d{6}\b/
        }
    };

    var ConvertMark = {
        prefix: "._.",
        toName: function (id) {
            return id.substring(id.indexOf(this.prefix) + this.prefix.length);
        },
        toId: function (name) {
            return this.prefix + name;
        }
    }

    var CheckResult = {
        Search: {
            ERROR: 0,
            SUCCEED: 1,
            WARN: 2,
            Range: _.range(0, 3)
        },
        Submit: {
            ERROR: 10,
            SUCCEED: 11,
            WARN: 12,
            WAIT: 13,
            Range: _.range(10, 14)
        },
        System: {
            ERROR: 20,
            SUCCEED: 21,
            WARN: 22,
            Range: _.range(20, 23)
        }
    };
    var originalStudents;
    var submitId;
    var submitStudents;

    var dataReturn = document.getElementById("dataReturn");
    var checkSearchReturn = document.getElementById("checkSearchReturn");
    var checkSubmitReturn = document.getElementById("checkSubmitReturn");
    var chooseReturn = document.getElementById("chooseReturn");
    var searchIn = document.getElementById("searchIn");

    var clearChooseReturn = function () {
        chooseReturn.innerHTML = "";
    };

    var clearDataReturn = function () {
        dataReturn.innerHTML = "";
    };

    var initDateStructure = function () {
        originalStudents = {};
        submitId = [];
        submitStudents = {};
    };

    var initHTML = function () {
        initDateStructure();
        clearChooseReturn();
        clearDataReturn();
        receiveJSON();
    }

    var stateExplainToMsg = function (state) {
        var msg;
        if (state == CheckResult['Search'].SUCCEED)
            msg = "输入合法，正在搜索！";
        if (state == CheckResult['Search'].WARN)
            msg = "输入不合法，房间号码不能为空！";
        if (state == CheckResult['Search'].ERROR)
            msg = "输入不合法，房间号码格式不正确！";
        if (state == CheckResult['Submit'].SUCCEED)
            msg = "输入合法，请确定输入信息无误，提交后无法修改！";
        if (state == CheckResult['Submit'].WAIT)
            msg = "正在向服务器提交信息...请勿关闭页面！"
        if (state == CheckResult['Submit'].WARN)
            msg = "输入不合法，请先选定一个宿舍（点击相应“Join”按钮选定）!";
        if (state == CheckResult['Submit'].ERROR)
            msg = "输入不合法，输入学号格式不正确！";
        if (state == CheckResult['System'].SUCCEED)
            msg = "写入数据成功，请查看表格确定！";
        if (state == CheckResult['System'].ERROR)
            msg = "写入数据库失败！"
        if (!msg)
            msg = "未知反馈信息!"

        return msg;
    }

    var log = function (state) {
        if (CheckResult['Search'].Range.indexOf(state) != -1) {
            checkSearchReturn.innerHTML = "<div class=\"alert alert-" +
                "info" +
                "\" role=\"alert\">" +
                "<button class=\"close\" type=\"button\"" +
                " data-dismiss=\"alert\">&times;</button>" +
                stateExplainToMsg(state) +
                "</div>";
        }
        if (CheckResult['Submit'].Range.indexOf(state) != -1) {
            checkSubmitReturn.innerHTML = stateExplainToMsg(state);
        }
        if (CheckResult['System'].Range.indexOf(state) != -1) {
            checkSubmitReturn.innerHTML = stateExplainToMsg(state);
        }
    };
    
    var belongPersonalAttribute = function (name) {
        if (name == Attribute.A || name == Attribute.B || name == Attribute.C || name == Attribute.D)
            return true;
        return false;
    };

    var readInforUsedNum = function (students) {
        var num = 0;
        var value;
        for (var name in students) {
            var value = students[name];
            if (value && belongPersonalAttribute(name)) {
                num++;
            }
        }
        return num;
    };

    var initInforShow = function (students) {
        //这里是给.html 文件，还是循环可扩展性好。   至于 和表格项对应应该是.html文件考虑的事情
        var str = "<tr>";

        for (var name in students) {
            str = str + "<td><h5>" + students[name] + "</h5></td>";
        }

        str = str + "<td>" +
            "<button type=\"button\" class=\"btn btn-primary\" onclick=\"indexClickSet.joinBtn('" +
            students[Attribute.ID] +
            "');\">" + "Join" +
            "<span class=\"badge\" aria-hidden=\"true\">" + readInforUsedNum(students) + "</span> " +
            "</button>" +
            "</td>" +
            "</tr>";
        dataReturn.innerHTML = dataReturn.innerHTML + str;
    };

    var produceID = function (name) {
        var id = ConvertMark.toId(name);
        submitId.push(id);
        return id;
    };


    var readInforShow = function (students) {

        for (var name in students) {
            var value = students[name];
            var attribute = "";
            var size = 6;
            var newId = produceID(name);
            if (value)
                attribute = "disabled";
            if (name == Attribute.ID) {
                value = "房间号码：" + value;
                size = 12;
            }
            if (name == Attribute.Remark) {
                size = 12;
                if (value)
                    value = "房间备注信息：" + value;
                else
                    value = "请输入备注信息（可选填）";
            }
            if (belongPersonalAttribute(name)) {
                if (value)
                    value = "床位占用者(" + name + "):" + value;
                else
                    value = "请输入学号信息(" + name + "可选填)";
            }

            chooseReturn.innerHTML = chooseReturn.innerHTML +
                "<div class=\"col-xs-" + size + "\">" +
                "<input class=\"form-control \" " +
                "id =\"" + newId + "\"" +
                "type=\"text\" placeholder=" +
                value + " " + attribute + ">" +
                "</div>";
        }
    };

    var collectDBInfor = function (students) {
        originalStudents = _.clone(students);
    };

    var readInfor = function (students, value) {
        if (value == students[Attribute.ID]) {
            readInforShow(students);
            collectDBInfor(students);
        }
    };

    var initWriteInfor = function (students) {
        submitStudents = _.clone(originalStudents);
    };

    var collectWriteInfor = function () {
        for (var index in submitId) {
            var id = submitId[index];
            var name = ConvertMark.toName(id);
            if (document.getElementById(id).value)
                submitStudents[name] = document.getElementById(id).value;
        }
    };

    var writeInfor = function () {
        initWriteInfor(originalStudents);
        collectWriteInfor();
    };

    var simplifySubmitInfor = function () {
        for (var name in submitStudents) {
            if (belongPersonalAttribute(name) && submitStudents[name])
                submitStudents[name] = submitStudents[name].match(Pattern["StudentNum"].simple);
        }
    };

    var simplifySearchInfor = function (value) {
        return value.match(Pattern["DormitoryNum"].simple);
    };

    var submitResult = function () {
        //如果是异步执行 将log()直接写在 fail 里， 以防异步函数还未得到结果， 后面的先向用户显示 出错。
        // 改成同步，就无所谓了, 这里的写法， 同步异步都OK
        var state = CheckResult["System"].ERROR;
        $.ajax({
            url: 'server/write.php',
            data: submitStudents,
            type: 'POST',
            async: false,
            dataType: 'json'
        }).done(function (result) {
            state = result;
            log(state);
        }).fail(function(xhr, status) {
            log(state);
        });
    };

    var transmitJSON = function () {
        simplifySubmitInfor();
        submitResult();
    };

    var submitCondition = function () {
        if ($.isEmptyObject(submitStudents)) {
            return CheckResult["Submit"].WARN;
        }
        if (_.isEqual(submitStudents, originalStudents)) {
            return CheckResult["Submit"].ERROR;
        }
        for (var name in submitStudents) {
            if (belongPersonalAttribute(name) && submitStudents[name]) {
                if (!Pattern["StudentNum"].all.test(submitStudents[name])) {
                    return CheckResult["Submit"].ERROR;
                }
            }
        }

        return CheckResult["Submit"].SUCCEED;
    };

    var searchCondition = function (value) {
        if (!value)
            return CheckResult["Search"].WARN;
        if (!Pattern["DormitoryNum"].all.test(value))
            return CheckResult["Search"].ERROR;

        return CheckResult["Search"].SUCCEED;
    };

    var formatDBInfor = function (students, simplfy = true) {
        var stuDeplicate = _.clone(students);

        for (var name in Attribute) {
            var value = stuDeplicate[Attribute[name]];
            if (!value)
                value = "";
            if (Attribute[name] != Attribute.ID && simplfy && value.length > 7)
                value = value.substring(0, 7) + "...";
            stuDeplicate[Attribute[name]] = value;
        }

        return stuDeplicate;
    }

    var receiveJSON = function (demand = "") {
        $.getJSON("server/dormitory.json").done(function (data) {
            $.each(data, function (index, dbstudents) {
                if (demand) {
                    readInfor(formatDBInfor(dbstudents, false), demand);
                }
                initInforShow(formatDBInfor(dbstudents, true));
            });
        }).fail(function (xhr, status) {
            alert('行为: ' + '从服务器读入数据 ' + '失败: ' + xhr.status + ', 原因: ' + status);
        });

    };

    //生成 包含所有 按钮相应函数 的对象
    var clickSet = {
        searchBtn: function () {
            clearChooseReturn();
            clearDataReturn();

            var state = searchCondition(searchIn.value);
            log(state);
                
            if (state == CheckResult["Search"].SUCCEED)
                receiveJSON(simplifySearchInfor(searchIn.value));
            else 
                receiveJSON();
        },
        joinBtn: function (id) {
            clearChooseReturn();
            clearDataReturn();

            var state = searchCondition(id);
            if (state == CheckResult["Search"].SUCCEED)
                receiveJSON(id);
            else
                receiveJSON();
        },
        checkSubmitBtn: function () {
            //先将表单数据转化为 对象
            writeInfor();
            //对将要发送的对象审核，反馈
            var state = submitCondition();
            if (state == CheckResult["Submit"].SUCCEED)
                $("#submitBtn").attr("disabled", false);
            else
                $("#submitBtn").attr("disabled", true);

            log(state);
        },
        submitBtn: function () {
            $("#submitBtn").attr("disabled", true);
            $("#closeSubmitBtn").attr("disabled", true);
            $("#stopSubmitBtn").attr("disabled", true);

            log(CheckResult["Submit"].WAIT)
            transmitJSON();

            $("#closeSubmitBtn").attr("disabled", false);
            $("#stopSubmitBtn").attr("disabled", false);

            //初始化信息
            initHTML();
        }
    };

    return {
        initHTML: initHTML,
        clickSet: clickSet
    }

});
