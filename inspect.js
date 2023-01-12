/** @param {NS} nsIn */
export async function main(ns) {
    const flags = ns.flags([
        ["depth", 1],
        ["expand", -1],
        ["exdepth", -1],
        ["doc", -1],
        ["cls", false],
        ["help", false],
    ])
    if (flags.help) {
        [   "example args: --depth 2 --cls --expand (rowNum) --exdepth 2 --doc (rowNum)",
            "\r\n",
            "    depth: How many levels deep to inspect. (default: 1)",
            "    cls: Specify to clear screen before printing the output. (default: false)",
            "    expand: Before using this argument, run once, then set this to a row number to expand and display that object.",
            "    exdepth: Like depth, but for the expanded object instead of the original object.",
            "    doc: Attempt to look up online documentation for that row. Only works if the documentation uses that name.",
            "    help: Display this help."]
            .forEach(function(s) {ns.tprintf(s)})
        return
    }
    if (flags.cls) {
    	ns.ui.clearTerminal()
    }
    //**************************************************************************
    //
    // Edit objToInspect to specify the initial object you want.
    //
    //**************************************************************************
    const objToInspect = [ns.infiltration, "ns.infiltration"]
    //const objToInspect = [ns.corporation, "ns.corproration"]
    //const objToInspect = [ns.bladeburner, "ns.bladeburner"]
    //const office = ns.corporation.getOffice("Ag", "Sector-12")
    //const objToInspect = [office, "ns.corporation.getOffice()"]
    //const terminalInput = document.getElementById("terminal-input")
    //const objToInspect = [terminalInput, "document.getElementById"]
    inspect({
        obj: objToInspect[0],
        name: objToInspect[1],
        maxDepth: flags.depth,
        expand: flags.expand,
        exDepth: flags.exdepth,
        doc: flags.doc,
        printFunc: ns.tprintf})
}

const DO_NOT_CALL = "don't call this function"
//******************************************************************************
// If a function requires arguments, it will fail to be fully inspected unless
// the arguments are specified here.
//
// Some functions such as goPublic() do not take any arguments, so they will be
// run by default if the depth is high enough,
// and you probably wouldn't want that to happen in your game.
// The default depth is only 1,
// so nothing will get run at that depth,
// and then you can check it and add anything here to prevent it from running,
// then go to the next depth.
//******************************************************************************
const functionArgs = {
    'getInfiltration': ["Joe's Guns"],
    'getCityChaos': ["Sector-12"],
    'getCityCommunities': ["Sector-12"],
    'getCityEstimatedPopulation': ["Sector-12"],
    'getBlackOpRank': ["Operation Typhoon"],
    'getActionEstimatedSuccessChance': ["Contract", "Tracking"],
    'getActionRepGain': ["Contract", "Tracking"],
    'getActionCountRemaining': ["Contract", "Tracking"],
    'getActionMaxLevel': ["Contract", "Tracking"],
    'getActionCurrentLevel': ["Contract", "Tracking"],
    'getActionAutolevel': ["Contract", "Tracking"],
    'getTeamSize': ["Operation", "Investigation"],
    'getSkillLevel': ["Blade's Intuition"],
    'stopBladeburnerAction': DO_NOT_CALL,
    'getOffice': ["Ag", "Sector-12"],
    'goPublic': DO_NOT_CALL,
    'acceptInvestmentOffer': DO_NOT_CALL,
}

//******************************************************************************
// This function doesn't actually get run.
// The statements prevent an error due to dynamic ram cost being higher
// than static.
//
// If you're low on memory, comment out anything you don't need,
// starting with the more costly lines.
//******************************************************************************
function increaseStaticRamCostOfThisScript() {
    ns.corporation.getCorporation()  //1024 GB
    ns.document  //25 GB
    ns.infiltration.getInfiltration()  //15 GB
    ns.infiltration.getPossibleLocations()  //5 GB
    ns.bladeburner.switchCity()  //4 GB
    ns.bladeburner.getCityChaos()  //4 GB
    ns.bladeburner.getCityCommunities()  //4 GB
    ns.bladeburner.getCityEstimatedPopulation()  //4 GB
    ns.bladeburner.setTeamSize()  //4 GB
    ns.bladeburner.getTeamSize()  //4 GB
    ns.bladeburner.upgradeSkill()  //4 GB
    ns.bladeburner.getSkillUpgradeCost()  //4 GB
    ns.bladeburner.getSkillUpgradeCost()  //4 GB
    ns.bladeburner.getSkillLevel()  //4 GB
    ns.bladeburner.getSkillPoints()  //4 GB
    ns.bladeburner.getRank()  //4 GB
    ns.bladeburner.setActionLevel()  //4 GB
    ns.bladeburner.setActionAutolevel()  //4 GB
    ns.bladeburner.getActionAutolevel()  //4 GB
    ns.bladeburner.getActionCurrentLevel()  //4 GB
    ns.bladeburner.getActionMaxLevel()  //4 GB
    ns.bladeburner.getActionCountRemaining()  //4 GB
    ns.bladeburner.getActionRepGain()  //4 GB
    ns.bladeburner.getActionEstimatedSuccessChance()  //4 GB
    ns.bladeburner.getActionCurrentTime()  //4 GB
    ns.bladeburner.getActionTime()  //4 GB
    ns.bladeburner.startAction()  //4 GB
}

function inspect(argd) {
    const objectsToInspect = []
    {
        const data = new DataToInspect()
        data.name = argd.name
        data.namespace = argd.name
        data.obj = argd.obj
        data.depth = 0
        objectsToInspect.push(data)
    }
    const rowsToDisplay = []
    let objectsNotExpanded = []
    while (objectsToInspect.length > 0) {
        const toInspect = objectsToInspect.pop()
        const type = typeof toInspect.obj
        let value = ""
        //debugger  //Helpful to trace errors. First go to Debug > Activate.
        if (toInspect.depth < argd.maxDepth) {
            let nextObj = null
            if (type == 'object') {
                nextObj = toInspect.obj
            } else if (type == 'function') {
                let args = []
                const baseName = toInspect.name.split(/\./g).at(-1)
                if (baseName in functionArgs) {
                    args = functionArgs[baseName]
                }
                if (args == DO_NOT_CALL) {
                    value = "(did not call)"
                } else {
                    try {
                        nextObj = toInspect.obj(...args)
                        value = "args[" + args + "]"
                    } catch (err) {
                        value = "(call failed -- specify args?)"
                    }
                }
            }
            if (nextObj != null) {
                if (typeof nextObj == 'object') {
                    for (const prop of Object.keys(nextObj).reverse()) {
                        const data = new DataToInspect()
                        data.name = prop
                        data.namespace = toInspect.namespace + "." + prop
                        data.obj = nextObj[prop]
                        data.depth = toInspect.depth + 1
                        objectsToInspect.push(data)
                    }
                } else {
                    objectsToInspect.push(["@returns", nextObj, toInspect.depth + 1])
                    const data = new DataToInspect()
                    data.name = "@returns"
                    data.namespace = toInspect.namespace
                    data.obj = nextObj
                    data.depth = toInspect.depth + 1
                    objectsToInspect.push(data)
                }
            }
        } else if (['object', 'function'].includes(type)) {
            objectsNotExpanded.push(toInspect.name)
        }
        if (['string', 'number', 'boolean'].includes(type)) {
            value = toInspect.obj
        }
        const data = new DataToDisplay()
        data.name = toInspect.name
        data.namespace = toInspect.namespace
        data.obj = toInspect.obj
        data.depth = toInspect.depth
        data.type = type
        data.value = value
        rowsToDisplay.push(data)
    }
    if (argd.expand > -1 && argd.expand < rowsToDisplay.length) {
        const data = rowsToDisplay[argd.expand]
        inspect({
            obj: data.obj,
            name: data.namespace,
            maxDepth: argd.exDepth,
            expand: -1,  //don't expand more than once
            doc: argd.doc,
            printFunc: argd.printFunc})
        return
    }
    if (argd.doc > -1 && argd.doc < rowsToDisplay.length) {
        const data = rowsToDisplay[argd.doc]
        const url = getUrl(data.namespace)
        argd.printFunc(`Opening ${url}`)
        window.open(url, '_blank')
    }
    displayResults(argd.name, rowsToDisplay, argd.printFunc)
    if (objectsNotExpanded.length > 0) {
        argd.printFunc(
            "\r\n%d objects or functions were not expanded (including %s).\r\nIncrease the depth for more.",
            objectsNotExpanded.length,
            objectsNotExpanded.slice(0, 3).join(", "))
    }
}

class DataToInspect {
    name = ""
    namespace = ""
    obj = null
    depth = 0
}
class DataToDisplay extends DataToInspect {
    type = ""
    value = null
}

function getUrl(callString) {
    const prefix = "https://github.com/bitburner-official/bitburner-src/blob/dev/markdown/bitburner."
    const suffix = ".md"
    callString = callString.toLowerCase()
    callString = callString.replace(/^ns./,'')
    callString = callString.replace(/[\(\)]/g,'')
    return prefix + callString + suffix
}

function displayResults(initialObjName, dataToDisplay, printFunc) {
    const rows = []
    for (const data of dataToDisplay) {
        let nameDisplay = '  '.repeat(data.depth) + data.name
        if (data.type == 'function') {
            nameDisplay += "()"
        }
        rows.push([rows.length, nameDisplay, data.type, data.value, data.namespace])
    }
    const WIDTH = 80
    const starLength = Math.floor((WIDTH - initialObjName.length - " Inspecting  ".length) / 2)
    const title = sprintf("%-" + starLength + "s Inspecting %s %" + starLength + "s",
        "*", initialObjName, "*")
    printFunc("*".repeat(title.length))
    printFunc("*" + " ".repeat(title.length - 2) + "*")
    printFunc(title)
    printFunc("*" + " ".repeat(title.length - 2) + "*")
    printFunc("*".repeat(title.length))
    printFunc(" ")
    printTable(["Row", "Property Name", "Type", "Value", "Namespace"], rows, printFunc)
}

export function header(titles, sizes) {
	const formats = getFormats(sizes)
	const dashes = sizes.map(sz => "-".repeat(sz))
	return  (
		sprintf(formats, ...titles) + "\r\n" +
		sprintf(formats, ...dashes))
}

export function printTable(titles, rows, printFunc) {
	const MAX_COL_LENGTH = 40
	let sizes = []
	for (let col = 0; col < titles.length; col++) {
		sizes[col] = titles[col].length
		for (const row of rows) {
			if (row[col].length > sizes[col]) {
				sizes[col] = row[col].length
			}
			if (sizes[col] > MAX_COL_LENGTH) {
				sizes[col] = MAX_COL_LENGTH
			}
		}
	}
	printFunc(header(titles, sizes))
	const formats = getFormats(sizes)
	for (const row of rows) {
		const vals = []
		for (const val of row) {
			let newVal = val.toString().split(/\r?\n/)[0]
			newVal = newVal.slice(0, MAX_COL_LENGTH)
			newVal = newVal.replaceAll(/%/g, "%%")
			vals.push(newVal)
		}
		printFunc(sprintf(formats, ...vals))
	}
}

function getFormats(sizes) {
	return sizes.reduce((acc, size, index) => {
		if (index > 0) {
			acc += " " 
		}
		return acc + "%-" + size + "." + size + "s" 
	}, "")
}
