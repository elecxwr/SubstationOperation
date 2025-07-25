// 加载CSV文件并解析数据
async function loadCSVData() {
    try {
        // 显示加载动画
        document.getElementById('loading').classList.remove('d-none');
        
        const response = await fetch('周期.csv');
        const csvText = await response.text();
        const result = parseCSV(csvText);
        
        // 隐藏加载动画
        document.getElementById('loading').classList.add('d-none');
        
        return result;
    } catch (error) {
        console.error('加载CSV文件失败:', error);
        // 隐藏加载动画
        document.getElementById('loading').classList.add('d-none');
        // 显示错误信息
        alert('加载数据失败，请刷新页面重试');
        return [];
    }
}

// 解析CSV文本为JSON数组
function parseCSV(csvText) {
    // 处理可能的BOM标记
    const text = csvText.replace(/^\ufeff/, '');
    
    // 按行分割
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return [];
    
    // 获取标题行
    const headers = lines[0].split(',');
    const result = [];

    // 从第二行开始处理数据
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // 跳过空行
        
        // 这里使用更复杂的逻辑来处理CSV，因为简单的split可能会在字段内容包含逗号时出错
        // 对于这个特定的CSV文件，我们知道每行有5个字段，可以使用正则表达式来分割
        const values = parseCSVLine(lines[i]);
        
        // 确保我们有足够的值
        if (values.length >= headers.length) {
            const entry = {};
            
            for (let j = 0; j < headers.length; j++) {
                entry[headers[j]] = values[j] || '';
            }
            
            result.push(entry);
        }
    }

    return result;
}

// 解析CSV行，处理字段中可能包含逗号的情况
function parseCSVLine(line) {
    // 对于我们的特定CSV，我们知道它有5个字段
    // 这个简单实现假设字段不包含引号和特殊字符
    // 如果CSV更复杂，需要使用更健壮的CSV解析库
    const fields = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            fields.push(currentField.trim());
            currentField = '';
        } else {
            currentField += char;
        }
    }
    
    // 添加最后一个字段
    fields.push(currentField.trim());
    
    return fields;
}

// 根据日期查找匹配的任务
function findTasksForDate(date, tasksData) {
    const day = date.getDate();
    const month = date.getMonth() + 1; // JavaScript月份从0开始
    const weekday = date.getDay(); // 0是周日，1-6是周一到周六
    
    return tasksData.filter(task => {
        const planTime = task.计划时间;
        
        // 检查是否匹配"每月X日"
        if (planTime.includes(`每月${day}日`)) {
            return true;
        }
        
        // 检查是否匹配"每月的X、Y、Z日"
        if (planTime.includes('每月的')) {
            const daysStr = planTime.split('每月的')[1].split('日')[0];
            const days = daysStr.split('、').map(d => parseInt(d));
            if (days.includes(day)) {
                return true;
            }
        }
        
        // 检查是否匹配"X月Y日"
        const specificMonthDayPattern = new RegExp(`${month}月${day}日`);
        if (specificMonthDayPattern.test(planTime)) {
            return true;
        }
        
        // 检查是否匹配"X月-Y月的每月Z日"
        if (planTime.includes('的每月') && planTime.includes('月-')) {
            const monthRange = parseInt(planTime.split('月-')[0]);
            const endMonth = parseInt(planTime.split('月-')[1].split('月的每月')[0]);
            const targetDay = parseInt(planTime.split('的每月')[1].split('日')[0]);
            
            if (month >= monthRange && month <= endMonth && day === targetDay) {
                return true;
            }
        }
        
        // 检查是否匹配"每年的X、Y、Z月的A、B、C日"
        if (planTime.includes('每年的') && planTime.includes('月的')) {
            const monthsStr = planTime.split('每年的')[1].split('月的')[0];
            const months = monthsStr.split('、').map(m => parseInt(m));
            
            if (months.includes(month)) {
                const daysStr = planTime.split('月的')[1].split('日')[0];
                const days = daysStr.split('、').map(d => parseInt(d));
                
                if (days.includes(day)) {
                    return true;
                }
            }
        }
        
        // 检查是否匹配"每周X"
        if (planTime.includes('每周')) {
            const weekdayMap = {
                '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0
            };
            
            const targetWeekday = planTime.split('每周')[1];
            const targetWeekdayNum = weekdayMap[targetWeekday];
            
            if (weekday === targetWeekdayNum) {
                return true;
            }
        }
        
        // 检查季度性任务 (1/4/7/10月X日)
        if (planTime.includes('/') && planTime.includes('月')) {
            const parts = planTime.split('月');
            const monthsStr = parts[0];
            const months = monthsStr.split('/').map(m => parseInt(m));
            
            if (months.includes(month)) {
                // 提取日期部分
                const dayPart = parts[1];
                if (dayPart) {
                    const targetDay = parseInt(dayPart.split('日')[0]);
                    if (day === targetDay) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    });
}

// 格式化日期为显示格式
function formatDate(date) {
    const weekdayMap = {
        0: '星期日',
        1: '星期一',
        2: '星期二',
        3: '星期三',
        4: '星期四',
        5: '星期五',
        6: '星期六'
    };
    const weekday = weekdayMap[date.getDay()];
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekday}`;
}

// 格式化日期为input元素格式
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 导出函数供其他模块使用
window.appUtils = {
    loadCSVData,
    findTasksForDate,
    formatDate,
    formatDateForInput
};