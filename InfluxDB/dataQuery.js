function queryByTimeRange(startTime, stopTime) {
    return `|> range(start: ${startTime}, stop: ${stopTime})`;
}
function queryByMeasurement(bucket, measurement) {
    return `from(bucket: "${bucket}") |> filter(fn: (r) => r["_measurement"] == "${measurement}")`;
}
function queryByField(field) {
    return `|> filter(fn: (r) => r["_field"] == "${field}")`;
}
function queryByTag(tagKey, tagValue) {
    return `|> filter(fn: (r) => r["${tagKey}"] == "${tagValue}")`;
}
function generateQuery(bucket, measurement, startTime = null, stopTime = null, field = null, tagKey = null, tagValue = null) {
    // Start the query with the measurement selection
    let query = queryByMeasurement(bucket, measurement);
    
    // Add time range if both startTime and stopTime are provided
    if (startTime && stopTime) {
        query += queryByTimeRange(startTime, stopTime);
    }
    
    // Add field filter if a field is provided
    if (field) {
        query += queryByField(field);
    }
    
    // Add tag filter if both tagKey and tagValue are provided
    if (tagKey && tagValue) {
        query += queryByTag(tagKey, tagValue);
    }
    
    return query;
}

// Example usage
const bucket = "my_bucket";
const measurement = "temperature";
const startTime = "-1h";  // Start time provided
const stopTime = "now()";  // Stop time provided
const field = "value";  // Field provided
const tagKey = null;  // Tag key not provided
const tagValue = null;  // Tag value not provided

const fluxQuery = generateQuery(bucket, measurement, startTime, stopTime, field, tagKey, tagValue);
console.log(fluxQuery);






function queryWithSum(windowPeriod) {
    return `|> aggregateWindow(every: ${windowPeriod}, fn: sum)`;
}
function queryWithCount(windowPeriod) {
    return `|> aggregateWindow(every: ${windowPeriod}, fn: count)`;
}
function queryWithAverage(windowPeriod) {
    return `|> aggregateWindow(every: ${windowPeriod}, fn: mean)`;
}
function queryWithMin(windowPeriod) {
    return `|> aggregateWindow(every: ${windowPeriod}, fn: min)`;
}

function queryWithMax(windowPeriod) {
    return `|> aggregateWindow(every: ${windowPeriod}, fn: max)`;
}
function generateAggregationQuery(bucket, measurement, startTime, stopTime, windowPeriod, aggregationType) {
    let query = queryByMeasurement(bucket, measurement);
    query += queryByTimeRange(startTime, stopTime);
    
    // Handle aggregation types based on input
    switch (aggregationType) {
        case "sum":
            query += queryWithSum(windowPeriod);
            break;
        case "count":
            query += queryWithCount(windowPeriod);
            break;
        case "average":
            query += queryWithAverage(windowPeriod);
            break;
        case "min":
            query += queryWithMin(windowPeriod);
            break;
        case "max":
            query += queryWithMax(windowPeriod);
            break;
        default:
            throw new Error("Invalid aggregation type");
    }

    return query;
}

// Example usage
const bucket1 = "my_bucket";
const measurement1 = "temperature";
const startTime1 = "-1h";
const stopTime1= "now()";
const windowPeriod1 = "30m";  // Aggregation period (e.g., 30 minutes)
const aggregationType1 = "sum";  // Aggregation operation

const fluxQuery1 = generateAggregationQuery(bucket1, measurement1, startTime1, stopTime1, windowPeriod1, aggregationType1);
console.log(fluxQuery1);





function queryWithAddition(field, valueToAdd) {
    return `|> map(fn: (r) => ({ r with _value: r._value + ${valueToAdd} }))`;
}
function queryWithSubtraction(field, valueToSubtract) {
    return `|> map(fn: (r) => ({ r with _value: r._value - ${valueToSubtract} }))`;
}
function queryWithMultiplication(field, multiplier) {
    return `|> map(fn: (r) => ({ r with _value: r._value * ${multiplier} }))`;
}
function queryWithDivision(field, divisor) {
    return `|> map(fn: (r) => ({ r with _value: r._value / ${divisor} }))`;
}
function queryWithDifference() {
    return `|> difference()`;
}
function queryWithAddAndMultiply(field, valueToAdd, multiplier) {
    return `|> map(fn: (r) => ({ r with _value: (r._value + ${valueToAdd}) * ${multiplier} }))`;
}
function generateMathAndAggregationQuery(bucket, measurement, startTime, stopTime, windowPeriod, aggregationType, operation, operationValue) {
    let query = generateAggregationQuery(bucket, measurement, startTime, stopTime, windowPeriod, aggregationType);

    // Add mathematical operation to the query after aggregation
    switch (operation) {
        case "addition":
            query += queryWithAddition("_value", operationValue);
            break;
        case "subtraction":
            query += queryWithSubtraction("_value", operationValue);
            break;
        case "multiplication":
            query += queryWithMultiplication("_value", operationValue);
            break;
        case "division":
            query += queryWithDivision("_value", operationValue);
            break;
        default:
            throw new Error("Invalid mathematical operation");
    }

    return query;
}

// Example usage
const bucket2 = "my_bucket";
const measurement2 = "temperature";
const startTime2 = "-1h";
const stopTime2 = "now()";
const windowPeriod2 = "30m";
const aggregationType2 = "sum";
const operation2 = "multiplication";
const operationValue2 = 1.5;

const fluxQuery2 = generateMathAndAggregationQuery(bucket2, measurement2, startTime2, stopTime2, windowPeriod2, aggregationType2, operation2, operationValue2);
console.log(fluxQuery2);




function queryWithPivot(rowKey, columnKey, valueKey) {
    return `|> pivot(rowKey: ["${rowKey}"], columnKey: ["${columnKey}"], valueColumn: "${valueKey}")`;
}
function queryWithGroup(groupColumns = []) {
    const columns = groupColumns.length ? `columns: ["${groupColumns.join('", "')}"]` : 'none: true';
    return `|> group(${columns})`;
}
function queryWithSort(sortColumns = ["_time"], desc = false) {
    return `|> sort(columns: ["${sortColumns.join('", "')}"], desc: ${desc})`;
}
function queryWithCondition(condition) {
    return `|> filter(fn: (r) => ${condition})`;
}
function queryWithLimit(limit) {
    return `|> limit(n: ${limit})`;
}
function queryWithDrop(columns) {
    return `|> drop(columns: ["${columns.join('", "')}"])`;
}
function queryWithKeep(columns) {
    return `|> keep(columns: ["${columns.join('", "')}"])`;
}
function generateDataTransformationQuery(bucket, measurement, startTime, stopTime, pivotOptions, groupColumns, sortColumns, desc) {
    let query = queryByMeasurement(bucket, measurement);
    query += queryByTimeRange(startTime, stopTime);

    // Add pivot
    if (pivotOptions) {
        const { rowKey, columnKey, valueKey } = pivotOptions;
        query += queryWithPivot(rowKey, columnKey, valueKey);
    }

    // Add group by
    if (groupColumns.length > 0) {
        query += queryWithGroup(groupColumns);
    }

    // Add sort
    if (sortColumns.length > 0) {
        query += queryWithSort(sortColumns, desc);
    }

    return query;
}

// Example usage
const bucket3 = "my_bucket";
const measurement3 = "temperature";
const startTime3 = "-1h";
const stopTime3 = "now()";

const pivotOptions3 = { rowKey: "_time", columnKey: "_field", valueKey: "_value" };
const groupColumns3 = ["location"];
const sortColumns3 = ["_time"];
const desc3 = false;

const fluxQuery3 = generateDataTransformationQuery(bucket3, measurement3, startTime3, stopTime3, pivotOptions3, groupColumns3, sortColumns3, desc3);
console.log(fluxQuery3);



function queryWithJoin(leftQuery, rightQuery, onColumns) {
    return `
        join(
            tables: {left: (${leftQuery}), right: (${rightQuery})},
            on: ["${onColumns.join('", "')}"]
        )`;
}
function queryWithUnion(queries) {
    return `union(tables: [${queries.join(', ')}])`;
}
function queryWithMovingAverage(period) {
    return `|> movingAverage(n: ${period})`;
}
function queryWithZScoreOutlierDetection(threshold) {
    return `
        |> map(fn: (r) => ({ r with zscore: (r._value - mean(r._value)) / stddev(r._value) }))
        |> filter(fn: (r) => abs(r.zscore) > ${threshold})
    `;
}
function queryWithWindow(windowPeriod) {
    return `|> window(every: ${windowPeriod})`;
}
function generateJoinAndMovingAverageQuery(bucket, measurement1, measurement2, startTime, stopTime, onColumns, period) {
    const leftQuery = `
        from(bucket: "${bucket}")
        |> range(start: ${startTime}, stop: ${stopTime})
        |> filter(fn: (r) => r["_measurement"] == "${measurement1}")
    `;
    
    const rightQuery = `
        from(bucket: "${bucket}")
        |> range(start: ${startTime}, stop: ${stopTime})
        |> filter(fn: (r) => r["_measurement"] == "${measurement2}")
    `;
    
    let query = queryWithJoin(leftQuery, rightQuery, onColumns);
    query += queryWithMovingAverage(period);

    return query;
}

// Example usage
const bucket4 = "my_bucket";
const measurement4 = "temperature";
const measurement5 = "humidity";
const startTime4 = "-1h";
const stopTime4 = "now()";
const onColumns4 = ["_time", "location"];
const period4 = 5;  // Moving average period

const fluxQuery4 = generateJoinAndMovingAverageQuery(bucket4, measurement4, measurement5, startTime4, stopTime4, onColumns4, period4);
console.log(fluxQuery4);


