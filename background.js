function matches(rule, item) {
    alert("matches");
  if (rule.matcher == 'js')
    return eval(rule.match_param);
  if (rule.matcher == 'hostname') {
    var link = document.createElement('a');
    link.href = item.url.toLowerCase();
    var host = (rule.match_param.indexOf(':') < 0) ? link.hostname : link.host;
    return (host.indexOf(rule.match_param.toLowerCase()) ==
            (host.length - rule.match_param.length));
  }
  if (rule.matcher == 'default')
    return item.filename == rule.match_param;
  if (rule.matcher == 'url-regex')
    return (new RegExp(rule.match_param)).test(item.url);
  if (rule.matcher == 'default-regex')
    return (new RegExp(rule.match_param)).test(item.filename);
  return false;
}


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    if (request.greeting == "hello")
      chrome.tabs.create({ 'url': 'chrome://extensions/?options=' + chrome.runtime.id });
  });

chrome.downloads.onDeterminingFilename.addListener(function(item, __suggest) {
  function suggest(filename, conflictAction) {
  //alert("inside suugggest. filename = "+filename);
    __suggest({filename: filename,
               conflictAction: conflictAction,
               conflict_action: conflictAction});
    //return "qqqqqqqq";
  }
  
  // alert("onDeterminingFilename. filename = "+JSON.stringify(item.filename));
  var rules = localStorage.rules;
  try {
    rules = JSON.parse(rules);
  } catch (e) {
    localStorage.rules = JSON.stringify([]);
  }
  
  suggested_filename = parseRules(rules, item.filename);
  
  if (suggested_filename){
    item.filename = suggested_filename;
  }
  
  suggest(item.filename, 'overwrite');

});

function parseRules(rules, filename)
{
    var filename_and_extension = filename.split('.');
    var extension = filename_and_extension.pop();
    var filename_only = filename_and_extension.pop();
    
    for (i = 0; i < rules.length; i++) { 
    
        rule = rules[i];
        alert("rule: "+JSON.stringify(rule));
        
        // rule is enabled, and at least one of the two rule types is set
        if (rule.enabled) {
            
            var fnAns = null;
            var extAns = null;
            
            // filename rule type is defined and not empty
            if ((rule.fnSelect != "none") && (rule.fnInput != ""))
                fnAns = matchRule(rule.fnSelect, rule.fnInput, filename_only);
            
            // extension rule type is defined and not empty
            if ((rule.extSelect != "none") && (rule.extInput != ""))
                extAns = matchRule(rule.extSelect, rule.extInput, extension);

            var isMatch = isMatchFound(fnAns, extAns);
            if (isMatch)
            {
                ans = rule.folder + "/" + filename;
                alert("matched extension! retunrning "+ ans);
                return ans;
            }
            
        } // rule.enabled
        else {
            console.log("rule is disabled");
        }
   } // rules loop
   
   // reached here means nothing is matched
   return null;
}

function isMatchFound(fnAns, extAns)
{
    if (fnAns != null && extAns != null && fnAns == true && extAns == true)  // both are defined and true
        return true; 
    else if (fnAns != null && extAns == null && fnAns == true)  // fnAns is defined and true
        return true;
    else if (fnAns == null && extAns != null && extAns == true)  // extAns is defined and true
        return true;
     else
         return false;
}

function matchRule(selectionType, selectionInput, data)
{
    /*
    selectionType - match, contains, regexMatch
    selectionInput - the input value from the user
    data - either the filename or the extension
    */
    
    var selectionInput = selectionInput.toLowerCase();
    var data = data.toLowerCase();
    var ans = false;
    switch (selectionType)
    {
        case "match":
            alert("MATCH ruletype for selection-type: "+ selectionType + " - data: " + data);
            selectionInput = selectionInput.split('.').join("");  // remove dot (".") from selectionInput.
            if (selectionInput == data) {
                alert("match!");
                ans = true;
            }
            break;
        
        case "contains":
            alert("CONTAINS ruletype for selection-type: "+ selectionType + " - data: " + data);
            selectionInput = selectionInput.split('.').join("");  // remove dot (".") from selectionInput.
            if (data.indexOf(selectionInput) != -1) {
                alert("match!");
                ans = true;
            }
            break;
            
        case "regexMatch":
            alert("REGEXTMATCH ruletype for selection-type: "+ selectionType + " - data: " + data);
            var re = new RegExp(data, "i");
            //alert("regexMatch "+re);
            if (data.search(re) > -1) {
                alert("match!");
                ans = true;
             }
            break;
    }
    return ans;
}    