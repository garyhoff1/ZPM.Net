using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(ZPM.Net.Startup))]
namespace ZPM.Net
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }
    }
}
