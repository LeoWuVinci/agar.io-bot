chrome.runtime.onMessageExternal.addListener(function(msg,sender,resp){
	console.log("forward",msg,sender,resp)
	chrome.tabs.query({url:'http://agar.io/*'},function(tabs){
		var tab=tabs[0]

		chrome.tabs.sendMessage(tab.id,msg,{},function(res){
			console.log("back",tab.id,msg,sender,res)
			resp(res)
		})
	})
	return true
})
