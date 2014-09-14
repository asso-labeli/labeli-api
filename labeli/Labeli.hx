package labeli;

class ApiAsyncProxy extends haxe.remoting.AsyncProxy<labeli.Api> {}

@:keep class Labeli
{
	var async : ApiAsyncProxy;
	
	public function new(url : String)
	{
		var asyncContext = haxe.remoting.HttpAsyncConnection.urlConnect(url);
		asyncContext.setErrorHandler(onError);
		this.async = new ApiAsyncProxy(asyncContext.api);
	}
	
	public function onError(e : Dynamic)
	{
		trace(e);
	}
	
	public static function main()
	{
		#if js
		untyped js.Browser.window.labeli = new Labeli("http://www.labeli.org/api");
		#end
	}
}